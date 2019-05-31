import React, { PureComponent } from 'react';
import { PieChart, Pie, Legend, Cell } from 'recharts';

export default function({ stats, width = 40, height = 30 }) {
  const COLORS = ['#cae8c5', '#e8c5c5', '#e5e5e5'];
  const data = [
    { name: 'correct', value: 0 },
    { name: 'incorrect', value: 0 },
    { name: 'noexecuted', value: 100 },
  ];

  if (stats) {
    data[0].value = stats.correct;
    data[1].value = stats.incorrect;
    data[2].value = stats.noexecuted || 0;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <PieChart width={width} height={height}>
        <Pie
          data={data}
          cx={15}
          cy={20}
          startAngle={180}
          endAngle={0}
          outerRadius={20}
          isAnimationActive={false}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      {stats && (
        <React.Fragment>
          <span style={{ color: COLORS[0], fontWeight: 'bold' }}>
            {stats.correct}
          </span>
          &nbsp;/&nbsp;
          <span style={{ color: COLORS[1], fontWeight: 'bold' }}>
            {stats.incorrect}
          </span>
        </React.Fragment>
      )}
    </div>
  );
}
