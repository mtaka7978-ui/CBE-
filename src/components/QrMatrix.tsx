import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface QrMatrixProps {
  payload: string;
  size?: number;
  color?: string;
}

export const QrMatrix: React.FC<QrMatrixProps> = ({
  payload,
  size = 160,
  color = '#111111',
}) => {
  const { modules, dim } = useMemo(() => {
    const qr = QRCode.create(payload || 'CBEBANK', {
      errorCorrectionLevel: 'M',
    });
    const count = qr.modules.size;
    const cells: boolean[] = [];
    for (let i = 0; i < count * count; i++) {
      cells.push(Boolean(qr.modules.data[i]));
    }
    return { modules: cells, dim: count };
  }, [payload]);

  const quietZone = 2;
  const totalDim = dim + quietZone * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalDim} ${totalDim}`}
      role="img"
      aria-label={`Scannable QR code: ${payload}`}
      shapeRendering="crispEdges"
      className="block rounded-xl bg-white"
    >
      <rect width={totalDim} height={totalDim} fill="#FFFFFF" />
      {modules.map((active, index) => {
        if (!active) return null;
        const row = Math.floor(index / dim);
        const col = index % dim;
        return (
          <rect
            key={index}
            x={col + quietZone}
            y={row + quietZone}
            width={1}
            height={1}
            fill={color}
          />
        );
      })}
    </svg>
  );
};
