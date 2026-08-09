const generateMeetingCode = () => {
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    const part3 = Math.floor(100 + Math.random() * 900);
  
    return `${part1}-${part2}-${part3}`;   //code like this 452-819-671
  };
  
  export default generateMeetingCode;