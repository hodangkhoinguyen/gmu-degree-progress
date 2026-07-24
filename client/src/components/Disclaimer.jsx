export default function Disclaimer({ sourceUrl }) {
  return (
    <div className="disclaimer no-print">
      Requirement data is sourced from the public{" "}
      <a href="https://catalog.gmu.edu" target="_blank" rel="noreferrer">
        GMU Catalog
      </a>{" "}
      by an automated importer and is not an official degree audit. Always verify against DegreeWorks
      or your academic advisor before making enrollment decisions.
      {sourceUrl && (
        <>
          {" "}
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            View this program's official catalog page →
          </a>
        </>
      )}
    </div>
  );
}
