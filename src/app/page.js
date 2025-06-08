"use client";

import React, { useState, useEffect } from "react";
import supabase from "../../supabase";

const Home = () => {
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState([
    "Critical",
    "Moderate",
    "Minor",
  ]);
  const [districtFilter, setDistrictFilter] = useState("All");
  const [dateRange, setDateRange] = useState({
    start: "2024-01-01", // Wide range for testing
    end: "2025-12-31",
  });
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  const updateLastUpdated = () => {
    setLastUpdated(new Date().toLocaleString());
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    return date.toISOString().replace("T", " ").substring(0, 16);
  };

  const getSeverity = (leakType) => {
    switch (leakType) {
      case "Burst Pipe":
        return "Critical";
      case "Moderate Leak":
        return "Moderate";
      case "Minor Leak":
        return "Minor";
      case "Broken Valve":
        return "Moderate";
      case "Small Leak":
        return "Minor";
      default:
        return "Minor"; // Treat unknown as Minor to avoid filtering everything out
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setReports(data);
        updateLastUpdated();
        // console.log("Fetched reports:", data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching reports:", err);
      }
    };

    fetchReports();

    const subscription = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        (payload) => {
          console.log("Realtime payload:", payload);
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    updateLastUpdated();

    const interval = setInterval(() => {
      updateLastUpdated();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const statistics = {
    totalActive: reports.filter((report) => !report.resolved).length,
    resolvedToday: reports.filter(
      (report) =>
        report.resolved &&
        report.created_at &&
        formatDate(report.created_at).startsWith("2025-06-07")
    ).length,
    criticalCases: reports.filter(
      (report) =>
        getSeverity(report.leak_type) === "Critical" && !report.resolved
    ).length,
    avgResponseTime: "3.2 hours",
  };

  const handleResolve = async (id) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ resolved: true })
        .eq("id", id);

      if (error) throw error;

      setReports(
        reports.map((report) =>
          report.id === id ? { ...report, resolved: true } : report
        )
      );

      updateLastUpdated();
    } catch (err) {
      console.error("Error updating report:", err);
      setError(err.message);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      activeFilter === "All" ||
      (activeFilter === "Active" && !report.resolved) ||
      (activeFilter === "Resolved" && report.resolved);

    const reportSeverity = getSeverity(report.leak_type);

    const matchesSeverity = severityFilter.includes(reportSeverity);

    const matchesDistrict =
      districtFilter === "All" || report.district === districtFilter;

    const reportDate = formatDate(report.created_at).split(" ")[0];
    const isInDateRange =
      reportDate >= dateRange.start && reportDate <= dateRange.end;

    console.log("Checking report:", {
      id: report.id,
      resolved: report.resolved,
      leak_type: report.leak_type,
      severityMapped: reportSeverity,
      district: report.district,
      created_at: report.created_at,
      matchesStatus,
      matchesSeverity,
      matchesDistrict,
      isInDateRange,
    });

    return matchesStatus && matchesSeverity && matchesDistrict && isInDateRange;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-500">
            Water Leak Dashboard
          </h1>
          <div className="text-sm text-gray-500">
            Last Updated: <span className="font-medium">{lastUpdated}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Active Leaks
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalActive}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-2">
                <i className="fas fa-tint text-red-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Resolved Today
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.resolvedToday}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-2">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Critical Cases
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.criticalCases}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-2">
                <i className="fas fa-exclamation-triangle text-orange-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Leak Reports Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Leak Reports</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    {/* Location */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.address}
                      {report.Description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {report.Description}
                        </p>
                      )}
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getSeverity(report.leak_type) === "Critical"
                            ? "bg-red-500"
                            : getSeverity(report.leak_type) === "Moderate"
                            ? "bg-orange-400"
                            : "bg-sky-500"
                        } text-white`}
                      >
                        {report.leak_type}
                      </span>
                    </td>

                    {/* Reported */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.created_at)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          report.resolved ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {report.resolved ? "Resolved" : "Active"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!report.resolved ? (
                        <button
                          onClick={() => handleResolve(report.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-500 hover:bg-green-600"
                        >
                          <i className="fas fa-check mr-1"></i> Mark Resolved
                        </button>
                      ) : (
                        <span className="text-gray-400">
                          <i className="fas fa-check-circle mr-1"></i> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredReports.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No leak reports match the current filters.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
