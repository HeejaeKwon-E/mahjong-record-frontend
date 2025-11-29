/** 브라우저 로컬 시간 대신 KST(한국시간) 기준 YYYY-MM-DD 반환 */
/*
export const todayStr = () => {
  const now = new Date();

  // 브라우저 로컬 → UTC 보정
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;

  // UTC → KST(+9)
  const kstTime = new Date(utc + 9 * 60 * 60 * 1000);
    console.log('KST Time:', kstTime);
  return kstTime.toISOString().slice(0, 10);
};

*/