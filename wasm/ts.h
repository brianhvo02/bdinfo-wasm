#include <cstdint>
#include <string>

#if !defined(_TS_H_)
#define _TS_H_

typedef struct packet_header {
    uint16_t sync_byte;
    uint8_t transport_error_indicator;
    uint8_t payload_unit_start_indicator;
    uint8_t transport_priority;
    uint16_t pid;
    uint8_t transport_scrambling_control;
    uint8_t adaptation_field_control;
    uint8_t continuity_counter;
} PACKET_HEADER;

typedef struct pes_header {
    uint8_t stream_id;
    uint16_t remaining_packet_length;
    uint8_t scrambling_control;
    uint8_t priority;
    uint8_t data_alignment_indicator;
    uint8_t copyright;
    uint8_t original;
    uint8_t pts_dts_indicator;
    uint8_t escr_flag;
    uint8_t es_rate_flag;
    uint8_t dsm_trick_mode_flag;
    uint8_t additional_copy_info_flag;
    uint8_t crc_flag;
    uint8_t extention_flag;
    uint8_t remaining_header_length;
} PES_HEADER;

void extract_audio_job(std::string clip_id, int pid);
void extract_video_job(std::string clip_id, int pid);

#endif // _TS_H_