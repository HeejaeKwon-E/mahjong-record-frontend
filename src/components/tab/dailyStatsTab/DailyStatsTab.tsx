import { RoundHistorySection } from './RoundHistorySection';
import { StatsSummarySection } from './StatsSummarySection';

type DailyStatsTabProps = {
  reloadDateData: (dateOverride?: string) => Promise<void>;
  showSnackbar: (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning',
  ) => void;
};

/** 일별 통계의 차트와 라운드 기록을 하나의 지연 로딩 단위로 묶습니다. */
export default function DailyStatsTab({
  reloadDateData,
  showSnackbar,
}: DailyStatsTabProps) {
  return (
    <div>
      <StatsSummarySection />
      <RoundHistorySection
        reloadDateData={reloadDateData}
        showSnackbar={showSnackbar}
      />
    </div>
  );
}
