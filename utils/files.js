const base64ToFile = (base64) => {
    return new Promise(async (resolve, reject) => {
        try {
            let extension;
            let data;

            if (base64.split(";").length > 1) {
                extension = base64.split(";")[0].split("/")[1];
                data = base64.split(";")[1].replace("base64", "");
            } else {
                data = base64;
                extension = "jpg";
            }
            
            // @ts-ignore
            const buffer = new Buffer.from(data, 'base64');
            resolve({
                file: buffer,
                extension,
                filename: `file.${extension}`
            })
        } catch (error) {
            reject(error);
        }
    });
}
module.exports = { base64ToFile }