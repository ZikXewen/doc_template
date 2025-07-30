export type IpcApi = {
  selectTemplateFile: () => Promise<string | null>;
  selectDatasheetFile: () => Promise<string | null>;
  submitForm: (input: IpcSubmitFormInput) => Promise<boolean>;
  openOutputFolder: () => Promise<void>;
  cancelOperation: () => Promise<void>;
  previewTemplateAndSheet: (
    templateFileName: string,
    datasheetFileName: string
  ) => Promise<{ templateVariables: string[]; datasheetColumns: string[] }>;
};

export type IpcSubmitFormInput = {
  templateFileName: string;
  datasheetFileName: string;
  suffix: string;
};
