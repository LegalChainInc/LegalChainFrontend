import { stripMarkdownArtifacts } from '../lib/displayText';

interface Analysis {
  summary: string;
  clauses: string[];
  risks: string[];
}

const AnalysisResult = ({ data }: { data: Analysis }) => {
  if (!data) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8 text-gray-800">
      <h3 className="text-2xl font-bold text-yellow-400 mb-4">AI Summary</h3>
      <p className="text-gray-800 mb-6">{stripMarkdownArtifacts(data.summary || 'No summary available.')}</p>

      <h4 className="text-xl font-semibold mb-2 text-yellow-300">Key Clauses</h4>
      {data.clauses?.length ? (
        <ul className="list-disc list-inside text-gray-800 mb-6">
          {data.clauses.map((clause, idx) => (
            <li key={idx}>{stripMarkdownArtifacts(clause)}</li>
          ))}
        </ul>
      ) : null}

      <h4 className="text-xl font-semibold mb-2 text-yellow-300">Risk Flags</h4>
      {data.risks?.length ? (
        <ul className="list-disc list-inside text-gray-800 mb-6">
          {data.risks.map((risk, idx) => (
            <li key={idx}>{stripMarkdownArtifacts(risk)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default AnalysisResult;

