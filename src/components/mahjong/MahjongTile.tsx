import type { NanikiruTile } from '../../state/nanikiruAtoms';

type MahjongTileProps = {
  tile: NanikiruTile;
  small?: boolean;
  selected?: boolean;
  drawn?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onSelect?: () => void;
};

const SUIT_TEXT = {
  man: '萬',
  pin: '筒',
  sou: '索',
} as const;

/**
 * 숫자패와 자패를 동일한 물성으로 표현하는 공용 마작패 컴포넌트입니다.
 *
 * 이미지 파일 대신 데이터셋의 code/type/suit/rank 값을 사용해 렌더링하므로
 * 적도라와 모든 패가 같은 크기·색상 규칙을 유지합니다. 클릭 가능한 손패와
 * 읽기 전용 도라 표시패도 이 컴포넌트를 공유합니다.
 */
export function MahjongTile({
  tile,
  small = false,
  selected = false,
  drawn = false,
  disabled = false,
  ariaLabel,
  onSelect,
}: MahjongTileProps) {
  const interactive = typeof onSelect === 'function' && !disabled;
  const suitClass = tile.suit ? `mahjong-tile--${tile.suit}` : '';
  const className = [
    'mahjong-tile',
    suitClass,
    tile.aka ? 'mahjong-tile--aka' : '',
    small ? 'mahjong-tile--small' : '',
    selected ? 'mahjong-tile--selected' : '',
    drawn ? 'mahjong-tile--drawn' : '',
    interactive ? 'mahjong-tile--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      disabled={!interactive}
      aria-label={ariaLabel ?? tile.meaning_ko}
      aria-pressed={interactive ? selected : undefined}
      onClick={onSelect}
    >
      {tile.type === 'number' && tile.suit ? (
        <>
          <span className="mahjong-tile__number">
            {tile.aka ? 5 : tile.rank}
          </span>
          <span className="mahjong-tile__suit">{SUIT_TEXT[tile.suit]}</span>
        </>
      ) : (
        <span
          className={`mahjong-tile__honor mahjong-tile__honor--${tile.color}`}
        >
          {tile.label}
        </span>
      )}
    </button>
  );
}
