/**
 * Type definitions for sib-api-v3-sdk (Brevo API SDK)
 * This is a minimal type declaration for the Brevo API SDK
 */

declare module 'sib-api-v3-sdk' {
  export default class ApiClient {
    static instance: ApiClient;
    authentications: {
      [key: string]: any;
    };
    basePath: string;
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(emailPayload: any): Promise<any>;
  }

  export class EmailCampaignsApi {
    createEmailCampaign(emailCampaign: any): Promise<any>;
  }
}
