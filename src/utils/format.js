export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || amount === "") return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
  
    // Convert to string and split into integer and decimal parts
    const [integerPart, decimalPart] = num.toString().split(".");
  
    // Add thousands separators to the integer part (Indian numbering system)
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedInteger = otherNumbers !== "" 
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree 
      : lastThree;
  
    // Return with decimal part if it exists
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };
  
  export const formatDate = (dateString) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      return d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  };
