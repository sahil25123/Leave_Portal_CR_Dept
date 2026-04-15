import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LeaveTable from "../components/LeaveTable";
import LoadingState from "../components/LoadingState";
import { getAllLeavesRequest } from "../services/admin.service";
import { getApiErrorMessage } from "../services/api";

function LeaveOverview() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaves() {
      setIsLoading(true);
      setError("");

      try {
        const leaveRows = await getAllLeavesRequest();
        setLeaves(leaveRows);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Failed to fetch leaves"));
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaves();
  }, []);

  return (
    <AppShell
      title="All Leaves"
      subtitle="Read-only overview of all leave applications in the system."
    >
      <ErrorAlert message={error} />

      {isLoading ? (
        <LoadingState label="Loading all leave records..." />
      ) : (
        <LeaveTable leaves={leaves} />
      )}
    </AppShell>
  );
}

export default LeaveOverview;
