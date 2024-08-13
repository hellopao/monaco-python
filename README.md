# monaco-python

monaco-editor with python lsp in browser

## install
```bash
npm i monaco-python
```

## usage

### basic usage
```javascript
import { setup } from 'monaco-python';

await setup(document.getElementById('container'), {
	value: 'print("hello world!")'
});
```

### customize theme
```javascript
import { setup, E_EDITOR_THEME } from 'monaco-python';

await setup(document.getElementById('container'), {
	theme: E_EDITOR_THEME.MONOKAI,
});
```

### customize typesheds
```javascript
import { setup } from 'monaco-python';

await setup(document.getElementById('container'), {
	typesheds: {
		'stubs/testtt/testtt.pyi': 'def test(words: str) -> str: ...'
	}
});
```

### customize typesheds
```javascript
import { setup } from 'monaco-python';

await setup(document.getElementById('container'), {
	snippets: {
		testtt: {
			prefix: "tt",
			body: "testtt(${1:words})",
			description: "testtt"
		}
	}
});
```

### vim mode
```javascript
import { setup } from 'monaco-python';
import { initVimMode } from 'monaco-vim';

const wrapper = await setup(document.getElementById('container'), {
	value: 'print("hello world!")'
});
const editor = wrapper.getEditor();

const vimMode = initVimMode(editor, document.getElementById('my-statusbar'))
```