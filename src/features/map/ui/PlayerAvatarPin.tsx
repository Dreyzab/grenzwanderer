interface PlayerAvatarPinProps {
  isMoving: boolean;
}

export const PlayerAvatarPin = ({ isMoving }: PlayerAvatarPinProps) => (
  <div
    className="gw-map-player-pin"
    data-moving={isMoving ? "true" : "false"}
    aria-label="Player position"
  >
    <span className="gw-map-player-pin__pulse" aria-hidden="true" />
    <span className="gw-map-player-pin__body" aria-hidden="true">
      <span className="gw-map-player-pin__core" />
    </span>
  </div>
);
