export function formatKrw(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatManWon(value: number): string {
  return `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원`;
}
