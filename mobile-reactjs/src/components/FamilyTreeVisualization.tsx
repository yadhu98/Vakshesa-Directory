import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import { getGrandGenerationIds } from './familyTreeKinship';

interface Props {
  data: any;
  focusUserId: string;
  initialZoom?: number;
  compact?: boolean;
  showSiblingConnections?: boolean;
  relationshipPath?: string[];
  heading?: string;
  description?: string;
}

const FamilyTreeVisualization: React.FC<Props> = ({ data, focusUserId, initialZoom = .85, compact = false, showSiblingConnections = false, relationshipPath, heading = 'Your family tree', description = 'Generations flow downward. Select a person to view their profile.' }) => {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(initialZoom);
  const cardWidth = compact ? 138 : 180;
  const cardHeight = compact ? 64 : 76;
  const cardGap = compact ? 10 : 24;
  const rowGap = compact ? 126 : 178;

  const chart = useMemo(() => {
    if (!data || !focusUserId) return null;
    const users = data.members || [];
    const links = data.relationships || [];
    const level = new Map<string, number>([[String(focusUserId), 0]]);
    const queue = [String(focusUserId)];
    const deltaFor = (type: string) => {
      if (type === 'child' || type === 'son' || type === 'daughter') return 1;
      if (type === 'parent' || type === 'father' || type === 'mother') return -1;
      return 0;
    };
    while (queue.length) {
      const current = queue.shift()!;
      for (const link of links) {
        let next = '';
        if (String(link.fromUserId) === current) next = String(link.toUserId);
        else if (String(link.toUserId) === current) next = String(link.fromUserId);
        if (!next || level.has(next)) continue;
        const outgoing = String(link.fromUserId) === current;
        level.set(next, (level.get(current) || 0) + deltaFor(String(link.type || '').toLowerCase()) * (outgoing ? 1 : -1));
        queue.push(next);
      }
    }
    const grouped = new Map<number, any[]>();
    users.forEach((member: any) => {
      const memberLevel = level.get(String(member._id));
      if (memberLevel === undefined) return;
      if (!grouped.has(memberLevel)) grouped.set(memberLevel, []);
      grouped.get(memberLevel)!.push(member);
    });
    const rows = Array.from(grouped.entries()).sort(([a], [b]) => a - b).map(([generation, members]) => ({ generation, members }));
    const width = Math.max(compact ? 340 : 600, ...rows.map(row => row.members.length * cardWidth + Math.max(0, row.members.length - 1) * cardGap));
    const positions = new Map<string, { x: number; y: number; generation: number }>();
    rows.forEach((row, rowIndex) => {
      const rowWidth = row.members.length * cardWidth + Math.max(0, row.members.length - 1) * cardGap;
      const left = (width - rowWidth) / 2;
      row.members.forEach((member: any, index: number) => positions.set(String(member._id), {
        x: left + index * (cardWidth + cardGap) + cardWidth / 2,
        y: rowIndex * rowGap,
        generation: row.generation,
      }));
    });
    const edges: Array<{ key: string; d: string; label?: string; x?: number; y?: number; markerStart?: boolean; markerEnd?: boolean }> = [];
    const seen = new Set<string>();
    // Prefer the focused member's edge when reciprocal links describe the same pair.
    [...links].sort((a: any, b: any) =>
      Number(String(b.fromUserId) === String(focusUserId)) - Number(String(a.fromUserId) === String(focusUserId)),
    ).forEach((link: any) => {
      const rawFrom = String(link.fromUserId);
      const rawTo = String(link.toUserId);
      const key = [rawFrom, rawTo].sort().join(':');
      if (seen.has(key)) return;
      seen.add(key);
      const type = String(link.type || '').toLowerCase();
      const a = positions.get(rawFrom);
      const b = positions.get(rawTo);
      if (!a || !b) return;
      if (['father', 'mother', 'parent'].includes(type)) {
        const parent = b;
        const child = a;
        if (parent.y >= child.y) return;
        const middleY = parent.y + cardHeight + (child.y - (parent.y + cardHeight)) / 2;
        edges.push({ key, d: `M ${parent.x} ${parent.y + cardHeight} V ${middleY} H ${child.x} V ${child.y}`, markerStart: !!relationshipPath?.length });
      } else if (type === 'child' || type === 'son' || type === 'daughter') {
        const parent = a;
        const child = b;
        if (parent.y >= child.y) return;
        const middleY = parent.y + cardHeight + (child.y - (parent.y + cardHeight)) / 2;
        edges.push({ key, d: `M ${parent.x} ${parent.y + cardHeight} V ${middleY} H ${child.x} V ${child.y}`, markerEnd: !!relationshipPath?.length });
      } else if (showSiblingConnections && ['brother', 'sister', 'sibling'].includes(type) && Math.abs(a.y - b.y) < 1) {
        const direction = a.x <= b.x ? 1 : -1;
        const startX = a.x + direction * cardWidth / 2;
        const endX = b.x - direction * cardWidth / 2;
        const label = type === 'sibling' ? 'Sibling' : type.charAt(0).toUpperCase() + type.slice(1);
        edges.push({ key, d: `M ${startX} ${a.y + cardHeight / 2} H ${endX}`, label, x: (a.x + b.x) / 2, y: a.y + cardHeight / 2 - 5, markerEnd: !!relationshipPath?.length });
      } else if (type === 'spouse' && Math.abs(a.y - b.y) < 1) {
        // Route above both cards so the spouse connector cannot look like it
        // joins an unrelated member positioned between them in the same row.
        const laneY = a.y - (compact ? 7 : 10);
        edges.push({ key, d: `M ${a.x} ${a.y} V ${laneY} H ${b.x} V ${b.y}`, label: 'Spouse', x: (a.x + b.x) / 2, y: laneY - 3, markerEnd: !!relationshipPath?.length });
      }
    });
    const memberLabels = new Map<string, string>();
    if (relationshipPath?.length) {
      memberLabels.set(String(relationshipPath[0]), 'You');
      for (let index = 1; index < relationshipPath.length; index += 1) {
        const previousId = String(relationshipPath[index - 1]);
        const memberId = String(relationshipPath[index]);
        const member = users.find((user: any) => String(user._id) === memberId);
        const edge = links.find((link: any) => String(link.fromUserId) === previousId && String(link.toUserId) === memberId);
        if (!member || !edge) continue;
        const type = String(edge.type || '').toLowerCase();
        const label = type === 'parent' ? (member.gender === 'female' ? 'Mother' : 'Father')
          : type === 'child' ? (member.gender === 'female' ? 'Daughter' : 'Son')
            : type === 'father' || type === 'mother' || type === 'son' || type === 'daughter' || type === 'brother' || type === 'sister' || type === 'spouse'
              ? type.charAt(0).toUpperCase() + type.slice(1)
              : 'Family member';
        memberLabels.set(memberId, label);
      }
    }
    // Prefer the relationship recorded from the focused member's perspective.
    // The reciprocal link is only a fallback and must not overwrite an
    // explicit label (for example Sister with its reciprocal Brother link).
    [...links].sort((a: any, b: any) =>
      Number(String(b.fromUserId) === String(focusUserId)) - Number(String(a.fromUserId) === String(focusUserId)),
    ).forEach((link: any) => {
      const from = String(link.fromUserId);
      const to = String(link.toUserId);
      if (relationshipPath?.length || (from !== String(focusUserId) && to !== String(focusUserId))) return;
      const memberId = from === String(focusUserId) ? to : from;
      const member = users.find((user: any) => String(user._id) === memberId);
      if (!member) return;
      const type = String(link.type || '').toLowerCase();
      let label = '';
      if (type === 'spouse') label = 'Spouse';
      else if (type === 'brother' || type === 'sister' || type === 'sibling') label = from === String(focusUserId) ? (type === 'sister' ? 'Sister' : type === 'brother' ? 'Brother' : member.gender === 'female' ? 'Sister' : 'Brother') : member.gender === 'female' ? 'Sister' : 'Brother';
      else if (type === 'father' || type === 'mother') label = from === String(focusUserId) ? (type === 'father' ? 'Father' : 'Mother') : (member.gender === 'female' ? 'Daughter' : 'Son');
      else if (type === 'son' || type === 'daughter') label = from === String(focusUserId) ? (type === 'son' ? 'Son' : 'Daughter') : (member.gender === 'female' ? 'Mother' : 'Father');
      else if (type === 'parent') label = from === String(focusUserId) ? (member.gender === 'female' ? 'Mother' : 'Father') : (member.gender === 'female' ? 'Daughter' : 'Son');
      else if (type === 'child') label = from === String(focusUserId) ? (member.gender === 'female' ? 'Daughter' : 'Son') : (member.gender === 'female' ? 'Mother' : 'Father');
      if (label && !memberLabels.has(memberId)) memberLabels.set(memberId, label);
    });
    // Grandparent/Grandchild is based on two parent-child links only; spouses
    // and siblings can share a displayed generation but cannot create the role.
    const { grandparents, grandchildren } = getGrandGenerationIds(String(focusUserId), links);
    if (!relationshipPath?.length) positions.forEach((_position, memberId) => {
      if (memberLabels.has(memberId)) return;
      if (grandparents.has(memberId)) memberLabels.set(memberId, 'Grandparent');
      else if (grandchildren.has(memberId)) memberLabels.set(memberId, 'Grandchild');
    });
    return { rows, width, height: Math.max(1, rows.length) * rowGap, positions, edges, memberLabels };
  }, [data, focusUserId, cardWidth, cardHeight, cardGap, rowGap, compact, relationshipPath]);

  const chartScrollRef = useRef<HTMLDivElement>(null);
  const arrowMarkerId = `family-tree-arrow-${useId().replace(/:/g, '')}`;
  useEffect(() => {
    const container = chartScrollRef.current;
    const focusPosition = chart?.positions.get(String(focusUserId));
    if (!container || !focusPosition) return;
    const frame = window.requestAnimationFrame(() => {
      const scale = zoom;
      container.scrollTo({
        left: Math.max(0, 16 + focusPosition.x * scale - container.clientWidth / 2),
        top: Math.max(0, 16 + (focusPosition.y + cardHeight / 2) * scale - container.clientHeight / 2),
        behavior: 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chart, focusUserId, zoom, cardHeight]);

  const generationLabel = (generation: number) => generation < 0 ? `Generation ${Math.abs(generation)} above` : generation > 0 ? `Generation ${generation} below` : 'Their generation';

  return <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '8px 0 12px' }}>
      {heading ? <div><strong style={{ fontSize: compact ? 14 : 18 }}>{heading}</strong>{description && <div style={{ marginTop: 3, color: '#777', fontSize: 12 }}>{description}</div>}</div> : <span />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}><button type="button" onClick={() => setZoom(value => Math.max(.15, value - .1))} aria-label="Zoom out" style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 7, background: '#fff', fontSize: 18, cursor: 'pointer' }}>−</button><span style={{ minWidth: 38, textAlign: 'center', fontSize: 12 }}>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(2.5, value + .1))} aria-label="Zoom in" style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 7, background: '#fff', fontSize: 17, cursor: 'pointer' }}>＋</button><button type="button" onClick={() => setZoom(initialZoom)} style={{ padding: '7px 8px', border: '1px solid #ddd', borderRadius: 7, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Reset</button></div>
    </div>
    {!data ? <p style={{ color: '#777', fontSize: 13 }}>Loading family tree…</p> : !chart || chart.rows.length === 0 ? <p style={{ color: '#777', fontSize: 13 }}>No family relationships have been added yet.</p> : <div ref={chartScrollRef} style={{ overflow: 'auto', maxHeight: compact ? 'none' : '72vh', padding: compact ? 8 : 16, border: '1px solid #eee', borderRadius: 10, background: '#fcfcfc' }}>
      <div style={{ position: 'relative', width: chart.width, height: chart.height, transform: `scale(${zoom})`, transformOrigin: 'top left', marginBottom: chart.height * (zoom - 1) }}>
        <svg aria-hidden="true" width={chart.width} height={chart.height} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}><defs><marker id={arrowMarkerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#656a70" /></marker></defs>{chart.edges.map(edge => <g key={edge.key}><path d={edge.d} fill="none" stroke="#aeb2b6" strokeWidth={compact ? 1.5 : 2} markerStart={edge.markerStart ? `url(#${arrowMarkerId})` : undefined} markerEnd={edge.markerEnd ? `url(#${arrowMarkerId})` : undefined} />{edge.label && <text x={edge.x} y={edge.y} textAnchor="middle" fill="#666" fontSize={compact ? 9 : 11} paintOrder="stroke" stroke="#fcfcfc" strokeWidth="4">{edge.label}</text>}</g>)}</svg>
        {chart.rows.map((row: any, rowIndex: number) => <React.Fragment key={row.generation}>
          <div style={{ position: 'absolute', top: rowIndex * rowGap - (compact ? 24 : 30), left: 0, width: '100%', color: '#777', fontSize: compact ? 10 : 12, fontWeight: 600, textAlign: 'center' }}>{generationLabel(row.generation)}</div>
          {row.members.map((member: any) => {
            const position = chart.positions.get(String(member._id));
            if (!position) return null;
            const current = String(member._id) === String(focusUserId);
            const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
            const shortName = fullName.length > 10 ? `${fullName.slice(0, 10)}...` : fullName;
            return <button key={member._id} type="button" title={fullName} onClick={() => navigate(`/profile/${member._id}`)} style={{ position: 'absolute', left: position.x - cardWidth / 2, top: position.y, width: cardWidth, height: cardHeight, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: compact ? 6 : 9, padding: compact ? '5px' : '7px 9px', background: current ? '#111' : '#fff', color: current ? '#fff' : '#111', border: current ? '2px solid #111' : '1px solid #d8d8d8', borderRadius: compact ? 8 : 10, boxShadow: '0 2px 8px rgba(0,0,0,.07)', cursor: 'pointer', font: 'inherit', textAlign: 'left', zIndex: 1 }}>
              {member.profilePicture ? <img src={member.profilePicture} alt="" style={{ width: compact ? 26 : 34, height: compact ? 26 : 34, flex: `0 0 ${compact ? 26 : 34}px`, objectFit: 'cover', borderRadius: '50%', background: '#eee' }} /> : <span aria-hidden="true" style={{ width: compact ? 26 : 34, height: compact ? 26 : 34, flex: `0 0 ${compact ? 26 : 34}px`, display: 'grid', placeItems: 'center', borderRadius: '50%', background: current ? '#fff' : '#ededed', color: '#333', fontSize: compact ? 8 : 10, fontWeight: 700 }}>{initials}</span>}
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', marginBottom: 2, color: current ? '#ddd' : '#777', fontSize: compact ? 7 : 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.house || 'Family'}</span><strong style={{ display: 'block', fontSize: compact ? 8 : 10, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName}</strong><span style={{ display: 'block', marginTop: 2, color: current ? '#ddd' : '#666', fontSize: compact ? 7 : 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chart.memberLabels.get(String(member._id)) || 'Family member'}</span></span>
            </button>;
          })}
        </React.Fragment>)}
      </div>
    </div>}
  </div>;
};

export default FamilyTreeVisualization;
