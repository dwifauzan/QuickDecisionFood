export const formatCurrency = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean ? new Intl.NumberFormat('en-US').format(parseInt(clean)) : '';
};

export const generateMapsUrl = (query: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export const cleanInput = (val: string) => val.trim();
