import React from 'react';

import { PieChart, Pie, Legend, Cell } from 'recharts';

export default function({ correct = 0, incorrect = 0, noresults = 0 }) {
  const COLORS = ['#52c41a', '#f5222d', '#e5e5e5'];
  const data = [
    { name: 'correct', value: correct },
    { name: 'incorrect', value: incorrect, label: 'none' },
    { name: 'none', value: noresults },
  ];

  return (
    <div style={{ textAlign: 'center', width: '100%', padding: '20px 0px' }}>
      <PieChart width={400} height={100}>
        <Pie
          data={data}
          cx={255}
          cy={90}
          startAngle={180}
          endAngle={0}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      <span style={{ fontSize: 18, fontWeight: 'bold', color: COLORS[0] }}>
        {correct}
      </span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: COLORS[1],
          paddingLeft: 10,
        }}
      >
        {incorrect}
      </span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: COLORS[2],
          paddingLeft: 10,
        }}
      >
        {noresults}
      </span>
    </div>
  );
}
