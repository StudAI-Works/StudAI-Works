// /frontend/src/utils/parseAIResponse.ts
export interface GeneratedFile {
  path: string;
  content: string;
  name: string;
}

export const parseAIResponse = (response: string): GeneratedFile[] => {
  // This regex expects code blocks that start like:
  // ```tsx
  // // path: /src/App.tsx
  // ... code ...
  // ```
  const fileRegex = /```[a-zA-Z]*(?:\s*)\/\/\s+path:\s+(.+?)\n([\s\S]*?)```/g;
  const files: GeneratedFile[] = [];
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(response)) !== null) {
    const filePath = match[1].trim();
    const code = match[2].trim();
    const name = filePath.split('/').pop() || filePath;
    files.push({ path: filePath, content: code, name });
  }
  // If index.js is present and it imports styles.css but there’s no styles.css file, inject default styles.
  const indexFile = files.find(f => f.path === '/src/index.js');
  if (indexFile && indexFile.content.includes("import './styles.css'") && !files.find(f => f.path === '/src/styles.css')) {
    files.push({
      path: '/src/styles.css',
      content: "/* default styles */",
      name: 'styles.css'
    });
  }
  return files;
};
