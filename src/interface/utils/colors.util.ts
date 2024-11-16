export const removeANSI = (text: string) => text.replace(/\x1B\[\d{1,2}(;\d{1,2})*m/g, '')
