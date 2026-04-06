import { fetchGuardian } from './guardian.js';
import { fetchBBC, fetchAlJazeera, fetchReuters, fetchFrance24, fetchDW, fetchNPR, fetchUNNews } from './rss.js';

export const SOURCE_REGISTRY = [
  {
    id: 'guardian',
    name: 'The Guardian',
    handle: '@guardian',
    color: '#1a73e8',
    badgeLetter: 'G',
    fetch: (fromDate, toDate) => fetchGuardian(fromDate, toDate),
  },
  {
    id: 'bbc',
    name: 'BBC World',
    handle: '@bbcworld',
    color: '#bb1919',
    badgeLetter: 'B',
    fetch: () => fetchBBC(),
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera',
    handle: '@aljazeera',
    color: '#d4a843',
    badgeLetter: 'AJ',
    fetch: () => fetchAlJazeera(),
  },
  {
    id: 'reuters',
    name: 'Reuters',
    handle: '@reuters',
    color: '#ff8800',
    badgeLetter: 'R',
    fetch: () => fetchReuters(),
  },
  {
    id: 'france24',
    name: 'France 24',
    handle: '@france24',
    color: '#2e5ea6',
    badgeLetter: 'F24',
    fetch: () => fetchFrance24(),
  },
  {
    id: 'dw',
    name: 'DW News',
    handle: '@dwnews',
    color: '#009ee3',
    badgeLetter: 'DW',
    fetch: () => fetchDW(),
  },
  {
    id: 'npr',
    name: 'NPR World',
    handle: '@nprworld',
    color: '#3d85c6',
    badgeLetter: 'NPR',
    fetch: () => fetchNPR(),
  },
  {
    id: 'unnews',
    name: 'UN News',
    handle: '@unnews',
    color: '#4b92db',
    badgeLetter: 'UN',
    fetch: () => fetchUNNews(),
  },
];

export function getSourceMeta(sourceId) {
  return SOURCE_REGISTRY.find(s => s.id === sourceId) || {
    id: sourceId,
    name: sourceId,
    handle: '',
    color: '#888888',
    badgeLetter: '?',
  };
}
