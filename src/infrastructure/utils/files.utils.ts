export default class FilesUtils {
    public static async base64ToFile(
        base64: string
    ): Promise<{ file: Buffer; extension: string; filename: string }> {
        let extension: string;
        let data: string;

        if (base64.split(";").length > 1) {
            extension = base64.split(";")[0].split("/")[1];
            data = base64.split(";")[1].replace("base64", "");
        } else {
            data = base64;
            extension = "jpg";
        }

        const buffer = Buffer.from(data, "base64");
        return {
            file: buffer,
            extension,
            filename: `file.${extension}`,
        };
    }
}
