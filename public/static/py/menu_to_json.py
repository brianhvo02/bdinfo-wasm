import array
import base64
import png
from json import JSONEncoder
from io import BytesIO
from igstools import IGSMenu

def extract_json_menu(path):
    menu = IGSMenu(path)
    return menu_to_json(menu)

def menu_to_json(menu):
    matrix = matrix_from_menu_height(menu.height)

    json_obj = {
        "version": 1,
        "pictures": {},
        "pages": {p.id: p.raw_data for p in menu.pages.values()},
        "width": menu.width,
        "height": menu.height,
    }

    for pic in menu.pictures.values():
        json_obj["pictures"][pic.id] = {
            "width": pic.width,
            "height": pic.height,
            "decoded_pictures": {},
        }

    for page in menu.pages.values():
        for bog in page.bogs:
            for button in bog.buttons.values():
                for state1 in button.states.values():
                    for pic in state1.values():
                        if pic is None or isinstance(pic, int):
                            continue

                        pictures = json_obj["pictures"][pic.id]["decoded_pictures"]
                        palette_id = page.palette_id
                        if palette_id not in pictures:
                            buffer = BytesIO()
                            picture_to_png(pic, page.palette, buffer, matrix)
                            pictures[palette_id] = base64.b64encode(buffer.getvalue()).decode("utf-8")
                            
    return JSONEncoder().encode(json_obj)

YCBCR_COEFF = {
    "601": (0.299,  0.587,  0.114 ),
    "709": (0.2126, 0.7152, 0.0722),
}

def _ycbcr_to_rgb48(y, cb, cr, coeff):
    assert y >= 0 and y <= 255
    assert cb >= 0 and cb <= 255
    assert cr >= 0 and cr <= 255

    kr, kg, kb = coeff
    offset_y = 16.0
    scale_y = 255.0 / 219.0
    scale_uv = 255.0 / 112.0

    sy = scale_y * (y - offset_y)
    scb = scale_uv * (cb - 128)
    scr = scale_uv * (cr - 128)

    r = sy                            + scr * (1 - kr)
    g = sy - scb * (1 - kb) * kb / kg - scr * (1 - kr) * kr / kg
    b = sy + scb * (1 - kb)

    r, g, b = [max(min(x, 255.0), 0.0) for x in (r, g, b)]

    r = round(r * 256 + r)
    g = round(g * 256 + g)
    b = round(b * 256 + b)

    return (r, g, b)


def _build_rgb_palette(ycbcr_palette, coeff):
    return {
        k: array.array("H",
            _ycbcr_to_rgb48(v["y"], v["cb"], v["cr"], coeff) +
            (v["alpha"] * 256 + v["alpha"],)
        )
        for k, v in ycbcr_palette.items()
    }


def matrix_from_menu_height(height):
    return "709" if height >= 600 else "601"


def picture_data_to_rgb(pic, rgb_palette, buffer, stride=None, buffer_offset=0):
    stride = stride or pic.width * 4
    assert stride >= pic.width * 4

    for y in range(pic.height):
        line_start = buffer_offset + stride * y
        for x in range(pic.width):
            index = pic.picture_data[y * pic.width + x]
            color = rgb_palette[index]
            offset = line_start + x * 4
            buffer[offset:offset+4] = color


def picture_to_png(pic, palette, stream, matrix):
    if isinstance(stream, str):
        with open(stream, "wb") as f:
            return picture_to_png(pic, palette, f)

    width = pic.width
    height = pic.height

    rgb_palette = _build_rgb_palette(palette, YCBCR_COEFF[matrix])
    image_buffer = bytearray(width * height * 8)
    with memoryview(image_buffer) as main_view:
        with main_view.cast("H") as view:
            picture_data_to_rgb(pic, rgb_palette, view)
            writer = png.Writer(width, height, alpha=True, bitdepth=16, greyscale=False)
            writer.write_array(stream, view)