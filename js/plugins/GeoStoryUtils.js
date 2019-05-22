
import Jimp from 'jimp';

let thumbnails = {};

export const setThumbnail = (src, size = [320, 180]) => {
    if (thumbnails[src]) return null;
    Jimp.read(src, (err, image) => {
        if (err) return err;
        image
            .resize(...size)
            .quality(60)
            .getBase64(Jimp.AUTO, (error, res) => {
                thumbnails[src] = res;
            });
    });
};

export const getThumbnail = (src) => {
    return thumbnails[src];
};
