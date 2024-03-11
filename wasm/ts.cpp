#include "ts.h"
#include "libbluray/bluray.h"
#include "libbluray/bdnav/clpi_data.h"
#include <stdio.h>
#include <filesystem>
#include <iostream>
#include <sndfile.h>
#include <fstream>
#include <thread>

using namespace std;
namespace fs = std::filesystem;

#define	BUFFER_LEN 4096
#define	INPUT_DIR "/mnt/BDMV"
#define	OUTPUT_DIR "/output"

void parse_packet_header(PACKET_HEADER *packet_header, unsigned char *header) {
    packet_header->sync_byte = header[0];
    packet_header->transport_error_indicator = (header[1] & 0x80) >> 7;
    packet_header->payload_unit_start_indicator = (header[1] & 0x40) >> 6;
    packet_header->transport_priority = (header[1] & 0x20) >> 5;
    packet_header->pid = ((uint16_t)(header[1] & 0x1f) << 8) | (uint16_t)header[2];
    packet_header->transport_scrambling_control = (header[3] & 0xc0) >> 6;
    packet_header->adaptation_field_control = (header[3] & 0x30) >> 4;
    packet_header->continuity_counter = header[3] & 0x0f;
}

void parse_pes_header(PES_HEADER *pes_header, unsigned char *pes) {
    pes_header->stream_id = pes[3];
    pes_header->remaining_packet_length = (((uint16_t)(pes[4]) & 0xFF) << 8) | ((uint16_t)(pes[5]) & 0xFF);
    pes_header->scrambling_control = (pes[6] & 0x30) >> 4;
    pes_header->priority = (pes[6] & 0x08) >> 3;
    pes_header->data_alignment_indicator = (pes[6] & 0x04) >> 2;
    pes_header->copyright = (pes[6] & 0x02) >> 1;
    pes_header->original = pes[6] & 0x01;
    pes_header->pts_dts_indicator = (pes[7] & 0xC0) >> 6;
    pes_header->escr_flag = (pes[7] & 0x20) >> 5;
    pes_header->es_rate_flag = (pes[7] & 0x10) >> 4;
    pes_header->dsm_trick_mode_flag = (pes[7] & 0x08) >> 3;
    pes_header->additional_copy_info_flag = (pes[7] & 0x04) >> 2;
    pes_header->crc_flag = (pes[7] & 0x02) >> 1;
    pes_header->extention_flag = pes[7] & 0x01;
    pes_header->remaining_header_length = pes[8];
}

void print_packet_header(PACKET_HEADER *packet_header) {
    printf("Sync byte: %02X\n", packet_header->sync_byte);
    printf("Transport error indicator (TEI): %02X\n", packet_header->transport_error_indicator);
    printf("Payload unit start indicator (PUSI): %02X\n", packet_header->payload_unit_start_indicator);
    printf("Transport priority: %02X\n", packet_header->transport_priority);
    printf("PID: %04X\n", packet_header->pid);
    printf("Transport scrambling control (TSC): %02X\n", packet_header->transport_scrambling_control);
    printf("Adaptation field control: %02X\n", packet_header->adaptation_field_control);
    printf("Continuity counter: %02X\n", packet_header->continuity_counter);
}

void print_pes_header(PES_HEADER pes_header) {
    printf("Stream ID: %02X\n", pes_header.stream_id);
    printf("Remaining packet length: %04X\n", pes_header.remaining_packet_length);
    printf("Scrambling control: %02X\n", pes_header.scrambling_control);
    printf("Priority: %02X\n", pes_header.priority);
    printf("Data alignment indicator: %02X\n", pes_header.data_alignment_indicator);
    printf("Copyright: %02X\n", pes_header.copyright);
    printf("Original: %02X\n", pes_header.original);
    printf("PTS/DTS indicator: %02X\n", pes_header.pts_dts_indicator);
    printf("ESCR flag: %02X\n", pes_header.escr_flag);
    printf("ES rate flag: %02X\n", pes_header.es_rate_flag);
    printf("DSM trick mode flag: %02X\n", pes_header.dsm_trick_mode_flag);
    printf("Additional copy info flag: %02X\n", pes_header.additional_copy_info_flag);
    printf("CRC flag: %02X\n", pes_header.crc_flag);
    printf("Extension flag: %02X\n", pes_header.extention_flag);
    printf("Remaining header length: %02X\n", pes_header.remaining_header_length);
}

uint8_t calculate_data_start(PACKET_HEADER *packet_header, PES_HEADER *pes_header, unsigned char *data) {
    uint8_t idx = 8;

    if (packet_header->adaptation_field_control == 0x03) {
        idx += 1 + data[8];
    }

    if (data[idx] == 0x00 && data[idx + 1] == 0x00 && data[idx + 2] == 0x01 && (
        (data[idx + 3] >= 0xC0 && data[idx + 3] <= 0xEF) || data[idx + 3] == 0xBD
    )) {
        parse_pes_header(pes_header, data + idx);
        idx += 9 + pes_header->remaining_header_length;

        if (pes_header->data_alignment_indicator == 1) {
            idx += 4;
        }
    }
    
    return idx;
}

void extract_track(string clip_id, int pid, string output_name) {
    string clip_path = INPUT_DIR "/CLIPINF/" + clip_id + ".clpi";
    string stream_path = INPUT_DIR "/STREAM/" + clip_id + ".m2ts";
    CLPI_CL *clip = bd_read_clpi(clip_path.c_str());
    uint32_t num_packets = clip->clip.num_source_packets;

    uintmax_t file_size = fs::file_size(stream_path);

    unsigned char *data = (unsigned char*)malloc(192);
    ifstream file(stream_path, ios::in | ios::binary);
    ofstream output(OUTPUT_DIR "/" + output_name, ios::out | ios::binary);
    output.seekp(output.beg);

    int count = -1;
    int currentCount;

    PACKET_HEADER *packet_header;
    PES_HEADER *pes_header;
    uint8_t data_start;

    for (int i = 0; i < num_packets; i++) {
        currentCount = (int)((double)i / (double)num_packets * 100);
        if (count < currentCount) {
            count = currentCount;
            cout << currentCount << '\n';
        }
        file.read((char *)data, 192);
        if (data[4] != 0x47) continue;

        // parse_packet_header(packet_header, data + 4);

        // if (packet_header->pid == pid) {
        //     data_start = calculate_data_start(packet_header, pes_header, data);
        //     output.write((char *)data + data_start, 192 - data_start);
        // }
    }
}

void convert_track(string input, string output) {
    SF_INFO input_info = SF_INFO();
    input_info.samplerate = 48000;
    input_info.channels = 2;
    input_info.format = SF_FORMAT_RAW | SF_FORMAT_PCM_24 | SF_ENDIAN_BIG;

    SF_INFO output_info = SF_INFO();
    output_info.samplerate = 48000;
    output_info.channels = 2;
    output_info.format = SF_FORMAT_WAV | SF_FORMAT_FLOAT | SF_ENDIAN_LITTLE;

    SNDFILE *input_file = sf_open((OUTPUT_DIR "/" + input).c_str(), SFM_READ, &input_info);
    SNDFILE *output_file = sf_open((OUTPUT_DIR "/" + output).c_str(), SFM_WRITE, &output_info);

    float data[BUFFER_LEN];
	int frames, readcount;

    frames = BUFFER_LEN / 2 ;
	readcount = frames;

	while (readcount > 0) {	
        readcount = sf_readf_float(input_file, data, frames);
		sf_writef_float(output_file, data, readcount);
	}

    sf_close(input_file);
	sf_close(output_file);
}

void extract_audio_job(string clip_id, int pid) {
    string filename = clip_id + "_" + to_string(pid);
    printf("Extracting audio track %d from %s.m2ts\n", pid, clip_id.c_str());
    extract_track(clip_id, pid, filename + ".pcm");
    // printf("Converting audio track %d from %s.m2ts\n", pid, clip_id.c_str());
    // convert_track(filename + ".pcm", filename + ".wav");
}

void extract_video_job(string clip_id, int pid) {
    printf("Extracting video track %d from %s.m2ts\n", pid, clip_id.c_str());
    extract_track(clip_id, pid, clip_id + "_" + to_string(pid) + ".h264");
}

// int main() {
//     thread video (extract_audio_job, "00001", 0x1011);
//     thread audio_1 (extract_audio_job, "00001", 0x1100);
//     thread audio_2 (extract_audio_job, "00001", 0x1101);
    
//     video.join();
//     audio_1.join();
//     audio_2.join();

//     return 0;
// }