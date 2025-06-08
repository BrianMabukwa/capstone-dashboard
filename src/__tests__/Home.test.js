// Home.test.js
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";
import supabase from "../../supabase";

// Mock Supabase client
jest.mock("../../supabase.js", () => {
  const mockReports = [
    {
      id: 1,
      address: "123 Main St",
      leak_type: "Burst Pipe",
      created_at: "2025-06-07T10:00:00Z",
      resolved: false,
      district: "District A",
      Description: "Severe water burst",
    },
    {
      id: 2,
      address: "456 Park Ave",
      leak_type: "Minor Leak",
      created_at: "2025-06-06T14:30:00Z",
      resolved: true,
      district: "District B",
      Description: "Dripping tap",
    },
  ];

  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          then: (resolve) => {
            resolve({ data: mockReports, error: null });
          },
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({})),
      })),
    })),
    removeChannel: jest.fn(),
  };
});

describe("Home Component", () => {
  test("renders reports and can mark as resolved", async () => {
    render(<Home />);

    // Wait for reports to load
    await waitFor(() => {
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("456 Park Ave")).toBeInTheDocument();
    });

    // Check initial status of the first report
    const firstReportStatus = screen.getAllByText("Active")[0];
    expect(firstReportStatus).toBeInTheDocument();

    // Click "Mark Resolved" button for the first report
    const markResolvedButton = screen.getByRole("button", {
      name: /Mark Resolved/i,
    });

    // Simulate click
    userEvent.click(markResolvedButton);

    // Wait for UI update
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Mark Resolved/i })).not.toBeInTheDocument();
      expect(screen.getAllByText("Resolved").length).toBeGreaterThan(0);
    });
  });
});
