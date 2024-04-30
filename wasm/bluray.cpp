#include <emscripten/bind.h>
#include <libbluray/bluray.h>
#include <libbluray/hdmv/mobj_data.h>
#include <libbluray/bdnav/mpls_data.h>
#include <libbluray/bdnav/meta_data.h>
#include <stdio.h>
#include <sstream>
#include <cstring>
#include <set>
#include <iostream>
#include <fstream>
#include <filesystem>

using namespace emscripten;
using namespace std;

namespace fs = std::filesystem;

BLURAY* bd;

string uint64_to_string(uint64_t value) {
    ostringstream os;
    os << value;
    return os.str();
}

EMSCRIPTEN_KEEPALIVE
string version() {
    int ver[3];
    bd_get_version(ver, ver + 1, ver + 2);
    stringstream ss;
    ss << ver[0] << '.' << ver[1] << '.' << ver[2];
    return ss.str();
}

EMSCRIPTEN_KEEPALIVE
int open_disc(string path) {
    const char *p = path.c_str();
    bd = bd_open(p, NULL);
    // bd_open_disc(bd, p, NULL);

    return bd_get_titles(bd, NULL, NULL);
}

struct BlurayTitle {
    string      name;
    bool        interactive;
    bool        accessible;
    bool        hidden;
    bool        bdj;
    uint32_t    id_ref;
};

BlurayTitle convert_title(const BLURAY_TITLE* title) {
    return BlurayTitle({
        title->name,
        title->interactive != 0,
        title->accessible != 0,
        title->hidden != 0,
        title->bdj != 0,
        title->id_ref
    });
}

struct BlurayInfo {
    bool                bluray_detected;
    string              disc_name;
    string              udf_volume_id;
    val                 disc_id;
    bool                no_menu_support;
    bool                first_play_supported;
    bool                top_menu_supported;
    uint32_t            num_titles;
    vector<BlurayTitle> titles;
    BlurayTitle         first_play;
    BlurayTitle         top_menu;
    uint32_t            num_hdmv_titles;
    uint32_t            num_bdj_titles;
    uint32_t            num_unsupported_titles;
    bool                bdj_detected;
    bool                bdj_supported;
    bool                libjvm_detected;
    bool                bdj_handled;
    string              bdj_org_id;
    string              bdj_disc_id;
    uint8_t             video_format;
    uint8_t             frame_rate;
    bool                content_exist_3D;
    uint8_t             initial_output_mode_preference;
    val                 provider_data;
    bool                aacs_detected;
    bool                libaacs_detected;
    bool                aacs_handled;
    int                 aacs_error_code;
    int                 aacs_mkbv;
    bool                bdplus_detected; 
    bool                libbdplus_detected;
    bool                bdplus_handled;
    uint8_t             bdplus_gen;
    uint32_t            bdplus_date;
    uint8_t             initial_dynamic_range_type;
};

BlurayInfo convert_disc_info(const BLURAY_DISC_INFO* info) {
    vector<BlurayTitle> titles;
    for (int i = 0; i < info->num_titles; i++) {
        titles.push_back(convert_title(info->titles[i]));
    }

    return BlurayInfo({
        info->bluray_detected != 0,
        info->disc_name,
        info->udf_volume_id,
        val(typed_memory_view(sizeof(info->disc_id), info->disc_id)),
        info->no_menu_support != 0,
        info->first_play_supported != 0,
        info->top_menu_supported != 0,
        info->num_titles,
        titles,
        convert_title(info->first_play),
        convert_title(info->top_menu),
        info->num_hdmv_titles,
        info->num_bdj_titles,
        info->num_unsupported_titles,
        info->bdj_detected != 0,
        info->bdj_supported != 0,
        info->libjvm_detected != 0,
        info->bdj_handled != 0,
        info->bdj_org_id,
        info->bdj_disc_id,
        info->video_format,
        info->frame_rate,
        info->content_exist_3D != 0,
        info->initial_output_mode_preference,
        val(typed_memory_view(sizeof(info->provider_data), info->provider_data)),
        info->aacs_detected != 0,
        info->libaacs_detected != 0,
        info->aacs_handled != 0,
        info->aacs_error_code,
        info->aacs_mkbv,
        info->bdplus_detected != 0,
        info->libbdplus_detected != 0,
        info->bdplus_handled != 0,
        info->bdplus_gen,
        info->bdplus_date,
        info->initial_dynamic_range_type
    });
}

EMSCRIPTEN_KEEPALIVE
BlurayInfo get_disc_info() {
    const BLURAY_DISC_INFO* info = bd_get_disc_info(bd);
    return convert_disc_info(info);
}

struct HDMVInstruction {
    unsigned int sub_grp;
    unsigned int op_cnt;
    unsigned int grp;

    unsigned int branch_opt;
    unsigned int reserved1;
    unsigned int imm_op2;
    unsigned int imm_op1;

    unsigned int cmp_opt;
    unsigned int reserved2;

    unsigned int set_opt;
    unsigned int reserved3;
};

struct MObjCommand {
    HDMVInstruction insn;
    uint32_t        insnVal;
    uint32_t        dst;
    uint32_t        src;
};

struct MObjObject {
    bool                resume_intention_flag;
    bool                menu_call_mask;
    bool                title_search_mask;
    uint16_t            num_cmds;
    vector<MObjCommand> cmds;
};

struct MObjObjects {
    uint32_t            mobj_version;
    uint16_t            num_objects;
    vector<MObjObject>  objects;
};

HDMVInstruction convert_instruction(const HDMV_INSN* insn) {
    return HDMVInstruction({
        insn->sub_grp,
        insn->op_cnt,
        insn->grp,
        insn->branch_opt,
        insn->reserved1,
        insn->imm_op2,
        insn->imm_op1,
        insn->cmp_opt,
        insn->reserved2,
        insn->set_opt,
        insn->reserved3
    });
}

static uint32_t _cmd_to_u32(HDMV_INSN *insn) {
    union {
        HDMV_INSN insn;
        uint8_t u8[4];
    } tmp;
    tmp.insn = *insn;
    return ((unsigned)tmp.u8[0] << 24) | (tmp.u8[1] << 16) | (tmp.u8[2] << 8) | tmp.u8[3];
}

MObjCommand convert_command(MOBJ_CMD* cmd) {
    return MObjCommand({
        convert_instruction(&cmd->insn),
        _cmd_to_u32(&cmd->insn),
        cmd->dst,
        cmd->src
    });
}

MObjObject convert_object(MOBJ_OBJECT* obj) {
    vector<MObjCommand> cmds;
    for (int i = 0; i < obj->num_cmds; i++) {
        cmds.push_back(convert_command(&obj->cmds[i]));
    }

    return MObjObject({
        obj->resume_intention_flag != 0,
        obj->menu_call_mask != 0,
        obj->title_search_mask != 0,
        obj->num_cmds,
        cmds
    });
}

MObjObjects convert_objects(MOBJ_OBJECTS* objs) {
    vector<MObjObject> objects;
    for (int i = 0; i < objs->num_objects; i++) {
        objects.push_back(convert_object(&objs->objects[i]));
    }

    return MObjObjects({
        objs->mobj_version,
        objs->num_objects,
        objects
    });
}

EMSCRIPTEN_KEEPALIVE
MObjObjects read_mobj(string path) {
    const char *p = path.c_str();
    MOBJ_OBJECTS* objs = bd_read_mobj(p);
    return convert_objects(objs);
}

struct MetaThumbnail {
    string           path;
    uint32_t         xres;
    uint32_t         yres;
};

struct MetaTitle {
    uint32_t         title_number;
    string           title_name;
};

struct MetaDiscLibrary {
    string                language_code;
    string                filename;
    string                di_name;
    string                di_alternative;
    uint8_t               di_num_sets;
    uint8_t               di_set_number;
    uint32_t              toc_count;
    vector<MetaTitle>     toc_entries;
    uint8_t               thumb_count;
    vector<MetaThumbnail> thumbnails;
};

MetaThumbnail convert_meta_thumbnail(META_THUMBNAIL* thumbnail) {
    return MetaThumbnail({
        thumbnail->path,
        thumbnail->xres,
        thumbnail->yres
    });
}

MetaTitle convert_meta_title(META_TITLE* title) {
    return MetaTitle({
        title->title_number,
        title->title_name
    });
}

MetaDiscLibrary convert_meta_dl(const META_DL* dl) {
    vector<MetaTitle> toc_entries;
    for (int i = 0; i < dl->toc_count; i++) {
        toc_entries.push_back(convert_meta_title(&dl->toc_entries[i]));
    }

    vector<MetaThumbnail> thumbnails;
    for (int i = 0; i < dl->thumb_count; i++) {
        thumbnails.push_back(convert_meta_thumbnail(&dl->thumbnails[i]));
    }

    return MetaDiscLibrary({
        dl->language_code,
        dl->filename,
        dl->di_name,
        dl->di_alternative,
        dl->di_num_sets,
        dl->di_set_number,
        dl->toc_count,
        toc_entries,
        dl->thumb_count,
        thumbnails
    });
}

EMSCRIPTEN_KEEPALIVE
MetaDiscLibrary get_metadata() {
    const META_DL* dl = bd_get_meta(bd);
    return convert_meta_dl(dl);
}

struct Clip {
    string          clip_id;
    string          codec_id;
};

struct Stream {
    uint8_t         stream_type;
    uint8_t         coding_type;
    uint16_t        pid;
    uint8_t         subpath_id;
    uint8_t         subclip_id;
    uint8_t         format;
    uint8_t         rate;
    uint8_t         dynamic_range_type;
    uint8_t         color_space;
    uint8_t         cr_flag;
    uint8_t         hdr_plus_flag;
    uint8_t         char_code;
    string          lang;
};

struct PlayItem {
    uint32_t        in_time;
    uint32_t        out_time;
    Clip            clip;
    vector<Stream>  video;
    vector<Stream>  audio;
    vector<Stream>  pg;
    vector<Stream>  ig;
    vector<Stream>  secondary_audio;
    vector<Stream>  secondary_video;
    vector<Stream>  dv;
};

struct SubPathPlayItem {
    uint32_t        in_time;
    uint32_t        out_time;
    uint16_t        sync_play_item_id;
    uint32_t        sync_pts;
    vector<Clip>    clips;
};

struct SubPath {
    uint8_t                 type;
    vector<SubPathPlayItem> sub_play_items;
};

struct Playlist {
    string           id;
    vector<PlayItem> play_items;
    vector<SubPath>  sub_paths;
    vector<MPLS_PLM> play_marks;
};

vector<Stream> convert_streams(MPLS_STREAM* streams, uint8_t stream_count) {
    vector<Stream> new_streams;
    for (int i = 0; i < stream_count; i++) {
        new_streams.push_back(Stream({
            streams[i].stream_type,
            streams[i].coding_type,
            streams[i].pid,
            streams[i].subpath_id,
            streams[i].subclip_id,
            streams[i].format,
            streams[i].rate,
            streams[i].dynamic_range_type,
            streams[i].color_space,
            streams[i].cr_flag,
            streams[i].hdr_plus_flag,
            streams[i].char_code,
            streams[i].lang
        }));
    }

    return new_streams;
}

vector<Clip> convert_clips(MPLS_CLIP* clip, uint8_t clip_count) {
    vector<Clip> new_clips;
    for (int i = 0; i < clip_count; i++) {
        new_clips.push_back(Clip({
            clip->clip_id,
            clip->codec_id
        }));
    }

    return new_clips;
}

vector<SubPathPlayItem> convert_sub_play_items(MPLS_SUB_PI* play_items, uint8_t pi_count) {
    vector<SubPathPlayItem> new_play_items;
    for (int i = 0; i < pi_count; i++) {
        new_play_items.push_back(SubPathPlayItem({
            play_items[i].in_time,
            play_items[i].out_time,
            play_items[i].sync_play_item_id,
            play_items[i].sync_pts,
            convert_clips(play_items[i].clip, play_items[i].clip_count)
        }));
    }

    return new_play_items;
}

EMSCRIPTEN_KEEPALIVE
Playlist get_playlist_info(string path) {
    MPLS_PL* playlist = bd_read_mpls(path.c_str());

    vector<PlayItem> play_items;
    for (int i = 0; i < playlist->list_count; i++) {
        MPLS_PI play_item = playlist->play_item[i];
        play_items.push_back(PlayItem({
            play_item.in_time,
            play_item.out_time,
            Clip({
                play_item.clip->clip_id,
                play_item.clip->codec_id
            }),
            convert_streams(play_item.stn.video, play_item.stn.num_video),
            convert_streams(play_item.stn.audio, play_item.stn.num_audio),
            convert_streams(play_item.stn.pg, play_item.stn.num_pg),
            convert_streams(play_item.stn.ig, play_item.stn.num_ig),
            convert_streams(play_item.stn.secondary_audio, play_item.stn.num_secondary_audio),
            convert_streams(play_item.stn.secondary_video, play_item.stn.num_secondary_video),
            convert_streams(play_item.stn.dv, play_item.stn.num_dv) 
        }));
    }

    vector<SubPath> sub_paths;
    for (int i = 0; i < playlist->sub_count; i++) {
        MPLS_SUB sub_path = playlist->sub_path[i];
        sub_paths.push_back(SubPath({
            sub_path.type,
            convert_sub_play_items(sub_path.sub_play_item, sub_path.sub_playitem_count)
        }));
    }
    
    vector<MPLS_PLM> play_marks;
    copy(&playlist->play_mark[0], &playlist->play_mark[playlist->mark_count], back_inserter(play_marks));
    
    return Playlist({ path.substr(7, 5), play_items, sub_paths, play_marks });
}

EMSCRIPTEN_KEEPALIVE
vector<Playlist> get_all_playlists() {
    vector<Playlist> playlists;
    for (const auto & entry : fs::directory_iterator("/files")) {
        string path = entry.path();
        if (path.find(".mpls") == string::npos)
            continue;

        Playlist pl = get_playlist_info(path);
        playlists.push_back(pl);
    }

    return playlists;
}

EMSCRIPTEN_BINDINGS(libbluray) {
    value_object<BlurayTitle>("BlurayTitle")
        .field("accessible", &BlurayTitle::accessible)
        .field("bdj", &BlurayTitle::bdj)
        .field("hidden", &BlurayTitle::hidden)
        .field("idRef", &BlurayTitle::id_ref)
        .field("interactive", &BlurayTitle::interactive)
        .field("name", &BlurayTitle::name);

    register_vector<BlurayTitle>("BlurayTitles");
    value_object<BlurayInfo>("Info")
        .field("aacsDetected", &BlurayInfo::aacs_detected)
        .field("aacsErrorCode", &BlurayInfo::aacs_error_code)
        .field("aacsHandled", &BlurayInfo::aacs_handled)
        .field("aacsMkbv", &BlurayInfo::aacs_mkbv)
        .field("bdjDetected", &BlurayInfo::bdj_detected)
        .field("bdjDiscId", &BlurayInfo::bdj_disc_id)
        .field("bdjHandled", &BlurayInfo::bdj_handled)
        .field("bdjOrgId", &BlurayInfo::bdj_org_id)
        .field("bdjSupported", &BlurayInfo::bdj_supported)
        .field("blurayDetected", &BlurayInfo::bluray_detected)
        .field("contentExist3D", &BlurayInfo::content_exist_3D)
        .field("discId", &BlurayInfo::disc_id)
        .field("discName", &BlurayInfo::disc_name)
        .field("firstPlay", &BlurayInfo::first_play)
        .field("firstPlaySupported", &BlurayInfo::first_play_supported)
        .field("frameRate", &BlurayInfo::frame_rate)
        .field("initialDynamicRangeType", &BlurayInfo::initial_dynamic_range_type)
        .field("initialOutputModePreference", &BlurayInfo::initial_output_mode_preference)
        .field("libaacsDetected", &BlurayInfo::libaacs_detected)
        .field("libbdplusDetected", &BlurayInfo::libbdplus_detected)
        .field("libjvmDetected", &BlurayInfo::libjvm_detected)
        .field("noMenuSupport", &BlurayInfo::no_menu_support)
        .field("numBDJTitles", &BlurayInfo::num_bdj_titles)
        .field("numHDMVTitles", &BlurayInfo::num_hdmv_titles)
        .field("numTitles", &BlurayInfo::num_titles)
        .field("numUnsupportedTitles", &BlurayInfo::num_unsupported_titles)
        .field("providerData", &BlurayInfo::provider_data)
        .field("topMenu", &BlurayInfo::top_menu)
        .field("topMenuSupported", &BlurayInfo::top_menu_supported)
        .field("udfVolumeId", &BlurayInfo::udf_volume_id)
        .field("videoFormat", &BlurayInfo::video_format)
        .field("titles", &BlurayInfo::titles);

    value_object<HDMVInstruction>("HDMVInstruction")
        .field("group", &HDMVInstruction::grp)
        .field("subGroup", &HDMVInstruction::sub_grp)
        .field("operandCount", &HDMVInstruction::op_cnt)
        .field("setOption", &HDMVInstruction::set_opt)
        .field("compareOption", &HDMVInstruction::cmp_opt)
        .field("branchOption", &HDMVInstruction::branch_opt)
        .field("iFlagOperand1", &HDMVInstruction::imm_op1)
        .field("iFlagOperand2", &HDMVInstruction::imm_op2)
        .field("reserved1", &HDMVInstruction::reserved1)
        .field("reserved2", &HDMVInstruction::reserved2)
        .field("reserved3", &HDMVInstruction::reserved3);

    value_object<MObjCommand>("MObjCommand")
        .field("instruction", &MObjCommand::insn)
        .field("instructionValue", &MObjCommand::insnVal)
        .field("destination", &MObjCommand::dst)
        .field("source", &MObjCommand::src);

    register_vector<MObjCommand>("MObjCommands");
    value_object<MObjObject>("MObjObject")
        .field("resumeIntentionFlag", &MObjObject::resume_intention_flag)
        .field("menuCallMask", &MObjObject::menu_call_mask)
        .field("titleSearchMask", &MObjObject::title_search_mask)
        .field("numCommands", &MObjObject::num_cmds)
        .field("commands", &MObjObject::cmds);

    register_vector<MObjObject>("MObjObjectsVector");
    value_object<MObjObjects>("MObjObjects")
        .field("version", &MObjObjects::mobj_version)
        .field("numObjects", &MObjObjects::num_objects)
        .field("objects", &MObjObjects::objects);

    value_object<Clip>("Clip")
        .field("clipId", &Clip::clip_id)
        .field("codecId", &Clip::codec_id);

    value_object<Stream>("Stream")
        .field("streamType", &Stream::stream_type)
        .field("codingType", &Stream::coding_type)
        .field("pid", &Stream::pid)
        .field("subpathId", &Stream::subpath_id)
        .field("subclipId", &Stream::subclip_id)
        .field("format", &Stream::format)
        .field("rate", &Stream::rate)
        .field("dynamicRangeType", &Stream::dynamic_range_type)
        .field("colorSpace", &Stream::color_space)
        .field("crFlag", &Stream::cr_flag)
        .field("hdrPlusFlag", &Stream::hdr_plus_flag)
        .field("charCode", &Stream::char_code)
        .field("lang", &Stream::lang);

    register_vector<Stream>("Streams");
    value_object<PlayItem>("PlayItem")
        .field("inTime", &PlayItem::in_time)
        .field("outTime", &PlayItem::out_time)
        .field("clip", &PlayItem::clip)
        .field("video", &PlayItem::video)
        .field("audio", &PlayItem::audio)
        .field("pg", &PlayItem::pg)
        .field("ig", &PlayItem::ig)
        .field("secondaryAudio", &PlayItem::secondary_audio)
        .field("secondaryVideo", &PlayItem::secondary_video)
        .field("dv", &PlayItem::dv);

    register_vector<Clip>("Clips");
    value_object<SubPathPlayItem>("SubPathPlayItem")
        .field("inTime", &SubPathPlayItem::in_time)
        .field("outTime", &SubPathPlayItem::out_time)
        .field("syncPlayItemId", &SubPathPlayItem::sync_play_item_id)
        .field("syncPts", &SubPathPlayItem::sync_pts)
        .field("clips", &SubPathPlayItem::clips);

    register_vector<SubPathPlayItem>("SubPathPlayItems");
    value_object<SubPath>("SubPath")
        .field("type", &SubPath::type)
        .field("subPlayItems", &SubPath::sub_play_items);

    value_object<MPLS_PLM>("PlayMark")
        .field("markType", &MPLS_PLM::mark_type)
        .field("playItemRef", &MPLS_PLM::play_item_ref)
        .field("time", &MPLS_PLM::time)
        .field("entryEsPid", &MPLS_PLM::entry_es_pid)
        .field("duration", &MPLS_PLM::duration);

    register_vector<PlayItem>("PlayItems");
    register_vector<SubPath>("SubPaths");
    register_vector<MPLS_PLM>("PlayMarks");
    value_object<Playlist>("Playlist")
        .field("id", &Playlist::id)
        .field("playItems", &Playlist::play_items)
        .field("subPaths", &Playlist::sub_paths)
        .field("playMarks", &Playlist::play_marks);

    register_vector<Playlist>("Playlists");

    value_object<MetaThumbnail>("MetaThumbnail")
        .field("path", &MetaThumbnail::path)
        .field("xres", &MetaThumbnail::xres)
        .field("yres", &MetaThumbnail::yres);

    value_object<MetaTitle>("MetaTitle")
        .field("titleNumber", &MetaTitle::title_number)
        .field("titleName", &MetaTitle::title_name);

    register_vector<MetaTitle>("MetaTitleVector");
    register_vector<MetaThumbnail>("MetaThumbnailVector");
    value_object<MetaDiscLibrary>("MetaDiscLibrary")
        .field("languageCode", &MetaDiscLibrary::language_code)
        .field("filename", &MetaDiscLibrary::filename)
        .field("diName", &MetaDiscLibrary::di_name)
        .field("diAlternative", &MetaDiscLibrary::di_alternative)
        .field("diNumSets", &MetaDiscLibrary::di_num_sets)
        .field("diSetNumber", &MetaDiscLibrary::di_set_number)
        .field("tocCount", &MetaDiscLibrary::toc_count)
        .field("tocEntries", &MetaDiscLibrary::toc_entries)
        .field("thumbCount", &MetaDiscLibrary::thumb_count)
        .field("thumbnails", &MetaDiscLibrary::thumbnails);
        
    emscripten::function("version", &version);
    emscripten::function("openDisc", &open_disc);
    emscripten::function("getDiscInfo", &get_disc_info);
    emscripten::function("readMobj", &read_mobj);
    emscripten::function("getPlaylistInfo", &get_playlist_info);
    emscripten::function("getAllPlaylists", &get_all_playlists);
    emscripten::function("getMetadata", &get_metadata);
}