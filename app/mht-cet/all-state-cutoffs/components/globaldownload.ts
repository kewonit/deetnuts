import { TData } from './types';
 
 function handleGlobalDownload(selectedRows: TData[]) {
    const data = JSON.stringify(selectedRows, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected_rows.json';
    link.click();
    URL.revokeObjectURL(url);
 }
 
 export { handleGlobalDownload };