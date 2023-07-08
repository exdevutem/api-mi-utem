import axios from "axios";

export default class FcmUtils {
    public static async sendNotification(
        tokens: string[],
        notification: object,
        data: any
    ): Promise<any> {
        try {
            const res = await axios.post(
                `https://fcm.googleapis.com/fcm/send`,
                {
                    registration_ids: tokens,
                    mutable_content: true,
                    content_available: true,
                    priority: "high",
                    notification,
                    data,
                },
                {
                    headers: {
                        Authorization: `key=${process.env.FCM_SERVER_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return res.data;
        } catch (error) {
            if (error.response?.data) {
                throw error.response.data;
            } else if (error.response) {
                console.log(error.response);
                throw error.response;
            } else {
                console.log(error);
                throw error;
            }
        }
    }
}
