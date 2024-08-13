import "@codingame/monaco-vscode-python-default-extension";
import { whenReady as whenMonokaiThemeReady } from "@codingame/monaco-vscode-theme-monokai-default-extension";
import { MonacoEditorLanguageClientWrapper, type UserConfig, } from "monaco-editor-wrapper";
import { BrowserMessageReader, BrowserMessageWriter, } from "vscode-languageserver-protocol/browser.js";
import { CloseAction, ErrorAction } from "vscode-languageclient";
import * as vscode from "vscode";
import * as monaco from 'monaco-editor';
import * as fflate from 'fflate';
import builtinSnippets from './snippet.json';

export enum E_EDITOR_THEME {
  MONOKAI = 'Monokai',
  DARK_MODERN = 'Default Dark Modern',
  DARK_PLUS = 'Dark+',
  DARK_VS = 'Dark (Visual Studio)',
  DARK_HIGH_CONTRAST = 'Dark High Contrast',
  LIGHT_HIGH_CONTRAST = 'Light High Contrast',
  LIGHT_MODERN = 'Default Light Modern',
  LIGHT_PLUS = 'Light+',
  LIGHT_VS = 'Light (Visual Studio)'
}

interface IEditorCustomConfig {
  theme?: E_EDITOR_THEME;
  typesheds?: Record<string, string>;
  snippets?: EditorSnippets;
}

export type EditorOptions = monaco.editor.IStandaloneEditorConstructionOptions & IEditorCustomConfig;
export type Editor = monaco.editor.IStandaloneCodeEditor;
export type EditorSnippets = Record<string, { body: string | string[]; description: string | string[]; }>;

const languageId = 'python';

const getTypeDefinitions = async (url: string) => {
  const result: Record<string, string> = {};
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const data = fflate.unzipSync(new Uint8Array(buffer));
    for (const [file, buf] of Object.entries(data)) {
      if (/\.pyi$/.test(file)) {
        result[file] = await fflate.strFromU8(buf);
      }
    }
  } catch (err) {
    console.warn('load typeshed files failed: ', err);
  }
  return result;
}

const getPyrightWorkerUrl = async (url: string) => {
  const scriptText = await fetch(url).then(res => res.text());
  const blob = new Blob([scriptText], { type: 'application/javascript ' });
  return URL.createObjectURL(blob);
}

export async function setup(container: HTMLElement, options: EditorOptions = {}): Promise<MonacoEditorLanguageClientWrapper> {
  const workspaceRoot = `/workspace`;
  const workspaceUri = vscode.Uri.parse(workspaceRoot);

  const { value = '', readOnly = false, typesheds = {}, snippets = {}, ...rest } = options;

  const wrapperConfig: UserConfig["wrapperConfig"] = {
    editorAppConfig: {
      $type: "extended",
      useDiffEditor: false,
      codeResources: {
        main: {
          uri: vscode.Uri.file(`${workspaceRoot}/setup.py`).toString(),
          text: value,
        },
      },
      readOnly,
      editorOptions: rest,
      awaitExtensionReadiness: [whenMonokaiThemeReady],
      userConfiguration: {
        json: JSON.stringify({
          'workbench.colorTheme': options.theme || E_EDITOR_THEME.MONOKAI
        })
      }
    },
    serviceConfig: {
      userServices: {
      },
      enableExtHostWorker: false,
      debugLogging: true,
    }
  };

  try {
    const baseURL = import.meta.env.BASE_URL;
    const homePage = baseURL === '/' ? window.location.href : baseURL;
    const builtinTypesheds = await getTypeDefinitions(
      new URL('typeshed.zip', homePage).href
    );

    const prightWorkerUrl = await getPyrightWorkerUrl(
      new URL('pyright.worker.js', homePage).href
    );

    const pyrightWorker = new Worker(prightWorkerUrl);

    pyrightWorker.postMessage({
      type: "browser/boot",
      mode: "foreground",
    });

    const pyrightReader = new BrowserMessageReader(pyrightWorker);
    const pyrightWriter = new BrowserMessageWriter(pyrightWorker);

    const languageClientConfig: UserConfig["languageClientConfig"] = {
      name: "Pyright Language Client",
      languageId,
      options: {
        $type: "WorkerDirect",
        worker: pyrightWorker,
      },
      clientOptions: {
        documentSelector: [languageId],
        workspaceFolder: {
          index: 0,
          name: "workspace",
          uri: workspaceUri,
        },
        initializationOptions: {
          files: { ...builtinTypesheds, ...typesheds },
        },
        errorHandler: {
          error: () => ({ action: ErrorAction.Continue }),
          closed: () => ({ action: CloseAction.DoNotRestart }),
        },
      },
      connectionProvider: {
        get: () => Promise.resolve({
          reader: pyrightReader,
          writer: pyrightWriter
        }),
      },
    };

    const loggerConfig: UserConfig["loggerConfig"] = {
      enabled: true,
      debugEnabled: true,
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    await wrapper.initAndStart({ wrapperConfig, languageClientConfig, loggerConfig }, container)

    monaco.languages.registerCompletionItemProvider(languageId, {
      // @ts-ignore
      provideCompletionItems() {
        const allSnippets = { ...builtinSnippets, ...snippets };
        return {
          suggestions: Object.keys(allSnippets).map(key => {
            const { body, description } = (allSnippets as EditorSnippets)[key];
            return {
              label: key,
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: typeof description === 'string' ? description : description.join('\n'),
              insertText: typeof body === 'string' ? body : body.join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            }
          })
        }
      }
    });

    return wrapper; 
  } catch (err) {
    console.log(`initialize monaco python editor failed`);
    throw err;
  }
}
