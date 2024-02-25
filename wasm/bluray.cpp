#include <emscripten/bind.h>
#include <libbluray/bluray.h>
#include <libbluray/hdmv/mobj_data.h>
#include <libbluray/bdnav/meta_data.h>
#include <stdio.h>
#include <sstream>
#include <cstring>

using namespace emscripten;
using namespace std;

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

struct StreamInfo {
    uint8_t  coding_type;
    uint8_t  format;
    uint8_t  rate;
    uint8_t  char_code;
    string   lang;
    uint16_t pid;
    uint8_t  aspect;
    uint8_t  subpath_id;
};

struct ClipInfo {
    uint32_t           pkt_count;
    uint8_t            still_mode;
    uint16_t           still_time;
    uint8_t            video_stream_count;
    uint8_t            audio_stream_count;
    uint8_t            pg_stream_count;
    uint8_t            ig_stream_count;
    uint8_t            sec_audio_stream_count;
    uint8_t            sec_video_stream_count;
    vector<StreamInfo> video_streams;
    vector<StreamInfo> audio_streams;
    vector<StreamInfo> pg_streams;
    vector<StreamInfo> ig_streams;
    vector<StreamInfo> sec_audio_streams;
    vector<StreamInfo> sec_video_streams;
    string             start_time;
    string             in_time;
    string             out_time;
    string             clip_id;
};
struct TitleChapter {
    uint32_t    idx;
    string      start;
    string      duration;
    string      offset;
    unsigned    clip_ref;
};

struct TitleMark {
    uint32_t    idx;
    int         type;
    string      start;
    string      duration;
    string      offset;
    unsigned    clip_ref;
};

struct TitleInfo {
    uint32_t             idx;
    uint32_t             playlist;
    string               duration;
    uint32_t             clip_count;
    uint8_t              angle_count;
    uint32_t             chapter_count;
    uint32_t             mark_count;
    vector<ClipInfo>     clips;
    vector<TitleChapter> chapters;
    vector<TitleMark>    marks;
    uint8_t              mvc_base_view_r_flag;
};

StreamInfo convert_stream_info(BLURAY_STREAM_INFO *info) {
    return StreamInfo({
        info->coding_type,
        info->format,
        info->rate,
        info->char_code,
        string((char *)info->lang),
        info->pid,
        info->aspect,
        info->subpath_id
    });
}

TitleChapter convert_title_chapter(BLURAY_TITLE_CHAPTER *chapter) {
    return TitleChapter({
        chapter->idx,
        uint64_to_string(chapter->start),
        uint64_to_string(chapter->duration),
        uint64_to_string(chapter->offset),
        chapter->clip_ref
    });
}

TitleMark convert_title_mark(BLURAY_TITLE_MARK *mark) {
    return TitleMark({
        mark->idx,
        mark->type,
        uint64_to_string(mark->start),
        uint64_to_string(mark->duration),
        uint64_to_string(mark->offset),
        mark->clip_ref
    });
}

ClipInfo convert_clip_info(BLURAY_CLIP_INFO *info) {
    vector<StreamInfo> video_streams;
    for (int i = 0; i < info->video_stream_count; i++) {
        video_streams.push_back(convert_stream_info(&info->video_streams[i]));
    }

    vector<StreamInfo> audio_streams;
    for (int i = 0; i < info->audio_stream_count; i++) {
        audio_streams.push_back(convert_stream_info(&info->audio_streams[i]));
    }

    vector<StreamInfo> pg_streams;
    for (int i = 0; i < info->pg_stream_count; i++) {
        pg_streams.push_back(convert_stream_info(&info->pg_streams[i]));
    }

    vector<StreamInfo> ig_streams;
    for (int i = 0; i < info->ig_stream_count; i++) {
        ig_streams.push_back(convert_stream_info(&info->ig_streams[i]));
    }

    vector<StreamInfo> sec_audio_streams;
    for (int i = 0; i < info->sec_audio_stream_count; i++) {
        sec_audio_streams.push_back(convert_stream_info(&info->sec_audio_streams[i]));
    }

    vector<StreamInfo> sec_video_streams;
    for (int i = 0; i < info->sec_video_stream_count; i++) {
        sec_video_streams.push_back(convert_stream_info(&info->sec_video_streams[i]));
    }

    return ClipInfo({
        info->pkt_count,
        info->still_mode,
        info->still_time,
        info->video_stream_count,
        info->audio_stream_count,
        info->pg_stream_count,
        info->ig_stream_count,
        info->sec_audio_stream_count,
        info->sec_video_stream_count,
        video_streams,
        audio_streams,
        pg_streams,
        ig_streams,
        sec_audio_streams,
        sec_video_streams,
        uint64_to_string(info->start_time),
        uint64_to_string(info->in_time),
        uint64_to_string(info->out_time),
        info->clip_id
    });
}

TitleInfo convert_title_info(BLURAY_TITLE_INFO *info) {
    vector<ClipInfo> clips;
    for (int i = 0; i < info->clip_count; i++) {
        clips.push_back(convert_clip_info(&info->clips[i]));
    }

    vector<TitleChapter> chapters;
    for (int i = 0; i < info->chapter_count; i++) {
        chapters.push_back(convert_title_chapter(&info->chapters[i]));
    }

    vector<TitleMark> marks;
    for (int i = 0; i < info->mark_count; i++) {
        marks.push_back(convert_title_mark(&info->marks[i]));
    }

    return TitleInfo({
        info->idx,
        info->playlist,
        uint64_to_string(info->duration),
        info->clip_count,
        info->angle_count,
        info->chapter_count,
        info->mark_count,
        clips,
        chapters,
        marks,
        info->mvc_base_view_r_flag
    });
}

EMSCRIPTEN_KEEPALIVE
TitleInfo get_playlist_info(uint32_t idx) {
    unsigned angle = bd_get_current_angle(bd);
    BLURAY_TITLE_INFO* playlist = bd_get_playlist_info(bd, idx, angle);
    return convert_title_info(playlist);
}

EMSCRIPTEN_KEEPALIVE
vector<TitleInfo> get_all_playlist_info() {
    unsigned angle = bd_get_current_angle(bd);
    uint32_t title_count = bd_get_titles(bd, NULL, NULL);

    vector<TitleInfo> playlists;
    for (int i = 0; i < title_count; i++) {
        TitleInfo playlist = get_playlist_info(i);
        playlists.push_back(playlist);
    }
    return playlists;
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

    value_object<TitleMark>("TitleMark")
        .field("idx", &TitleMark::idx)
        .field("type", &TitleMark::type)
        .field("start", &TitleMark::start)
        .field("duration", &TitleMark::duration)
        .field("offset", &TitleMark::offset)
        .field("clipRef", &TitleMark::clip_ref);

    value_object<TitleChapter>("TitleChapter")
        .field("idx", &TitleChapter::idx)
        .field("start", &TitleChapter::start)
        .field("duration", &TitleChapter::duration)
        .field("offset", &TitleChapter::offset)
        .field("clipRef", &TitleChapter::clip_ref);

    value_object<StreamInfo>("StreamInfo")
        .field("aspect", &StreamInfo::aspect)
        .field("charCode", &StreamInfo::char_code)
        .field("codingType", &StreamInfo::coding_type)
        .field("format", &StreamInfo::format)
        .field("lang", &StreamInfo::lang)
        .field("pid", &StreamInfo::pid)
        .field("rate", &StreamInfo::rate)
        .field("subpathId", &StreamInfo::subpath_id);

    register_vector<StreamInfo>("Streams");
    value_object<ClipInfo>("ClipInfo")
        .field("pktCount", &ClipInfo::pkt_count)
        .field("stillMode", &ClipInfo::still_mode)
        .field("stillTime", &ClipInfo::still_time)
        .field("videoStreamCount", &ClipInfo::video_stream_count)
        .field("audioStreamCount", &ClipInfo::audio_stream_count)
        .field("PGStreamCount", &ClipInfo::pg_stream_count)
        .field("IGStreamCount", &ClipInfo::ig_stream_count)
        .field("secondaryVideoStreamCount", &ClipInfo::sec_video_stream_count)
        .field("secondaryAudioStreamCount", &ClipInfo::sec_audio_stream_count)
        .field("audioStreams", &ClipInfo::audio_streams)
        .field("videoStreams", &ClipInfo::video_streams)
        .field("pgStreams", &ClipInfo::pg_streams)
        .field("igStreams", &ClipInfo::ig_streams)
        .field("secondaryAudioStreams", &ClipInfo::sec_audio_streams)
        .field("secondaryVideoStreams", &ClipInfo::sec_video_streams)
        .field("startTime", &ClipInfo::start_time)
        .field("inTime", &ClipInfo::in_time)
        .field("outTime", &ClipInfo::out_time)
        .field("clipId", &ClipInfo::clip_id);

    register_vector<ClipInfo>("Clips");
    register_vector<TitleChapter>("Chapters");
    register_vector<TitleMark>("Marks");
    value_object<TitleInfo>("TitleInfo")
        .field("idx", &TitleInfo::idx)
        .field("playlist", &TitleInfo::playlist)
        .field("duration", &TitleInfo::duration)
        .field("clipCount", &TitleInfo::clip_count)
        .field("angleCount", &TitleInfo::angle_count)
        .field("chapterCount", &TitleInfo::chapter_count)
        .field("markCount", &TitleInfo::mark_count)
        .field("clips", &TitleInfo::clips)
        .field("chapters", &TitleInfo::chapters)
        .field("marks", &TitleInfo::marks)
        .field("MVCBaseViewRFlag", &TitleInfo::mvc_base_view_r_flag);

    register_vector<TitleInfo>("TitleInfoVector");

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
    emscripten::function("getAllPlaylistInfo", &get_all_playlist_info);
    emscripten::function("getMetadata", &get_metadata);
}