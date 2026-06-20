'use no memo';

interface VelocitySprint {
    name: string;
    committed: number | null;
    completed: number;
}

interface Props {
    sprints: VelocitySprint[];
    avgVelocity: number;
}

export function VelocityChart({ sprints, avgVelocity }: Props) {
    if (sprints.length === 0) {
        return null;
    }

    const padding = { top: 20, right: 16, bottom: 28, left: 40 };
    const width = 500;
    const height = 220;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(
        ...sprints.map((s) => s.committed ?? 0),
        ...sprints.map((s) => s.completed),
        avgVelocity,
        1,
    );

    const barGroupWidth = chartW / sprints.length;
    const barWidth = Math.min(barGroupWidth * 0.3, 24);
    const gap = Math.min(barGroupWidth * 0.1, 6);

    const xScale = (index: number) =>
        padding.left + index * barGroupWidth + barGroupWidth / 2;
    const yScale = (val: number) =>
        padding.top + chartH - (val / maxVal) * chartH;

    const yTicks = [0, Math.round(maxVal / 2), maxVal];

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full max-w-full font-mono"
        >
            <line
                x1={padding.left}
                y1={padding.top + chartH}
                x2={padding.left + chartW}
                y2={padding.top + chartH}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
            />
            <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + chartH}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
            />

            {yTicks.map((tick) => (
                <g key={tick}>
                    <line
                        x1={padding.left}
                        y1={yScale(tick)}
                        x2={padding.left + chartW}
                        y2={yScale(tick)}
                        stroke="currentColor"
                        className="text-muted/60"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                    />
                    <text
                        x={padding.left - 6}
                        y={yScale(tick) + 3}
                        textAnchor="end"
                        className="fill-muted-foreground"
                        fontSize={10}
                    >
                        {tick}
                    </text>
                </g>
            ))}

            {avgVelocity > 0 && (
                <>
                    <line
                        x1={padding.left}
                        y1={yScale(avgVelocity)}
                        x2={padding.left + chartW}
                        y2={yScale(avgVelocity)}
                        stroke="hsl(0, 84%, 60%)"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                    />
                    <text
                        x={padding.left + chartW + 4}
                        y={yScale(avgVelocity) + 3}
                        className="fill-muted-foreground"
                        fontSize={9}
                    >
                        Avg
                    </text>
                </>
            )}

            {sprints.map((sprint, i) => {
                const cx = xScale(i);
                const committedH = ((sprint.committed ?? 0) / maxVal) * chartH;
                const completedH = (sprint.completed / maxVal) * chartH;

                return (
                    <g key={sprint.name}>
                        {sprint.committed != null && (
                            <rect
                                x={cx - barWidth - gap / 2}
                                y={yScale(sprint.committed)}
                                width={barWidth}
                                height={committedH}
                                fill="currentColor"
                                className="text-muted-foreground/30"
                                rx={3}
                            />
                        )}
                        <rect
                            x={cx + gap / 2}
                            y={yScale(sprint.completed)}
                            width={barWidth}
                            height={completedH}
                            fill="currentColor"
                            className="text-primary"
                            rx={3}
                        />
                        <text
                            x={cx}
                            y={padding.top + chartH + 16}
                            textAnchor="middle"
                            className="fill-muted-foreground"
                            fontSize={9}
                        >
                            {sprint.name.length > 8
                                ? sprint.name.slice(0, 8) + '…'
                                : sprint.name}
                        </text>
                    </g>
                );
            })}

            <text
                x={padding.left + 4}
                y={padding.top - 6}
                className="fill-muted-foreground"
                fontSize={9}
            >
                Story Points
            </text>
        </svg>
    );
}
