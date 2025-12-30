import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@material-ui/core";

const toMiles = (activity) => {
  const d = Number(activity?.distance || 0);
  if (activity?.distanceUnits === "Yards") return d / 1760;
  return d; // assume miles
};

const toDateSafe = (x) => {
  if (!x) return null;
  if (x instanceof Date) return x;
  if (typeof x.toDate === "function") return x.toDate(); // Firestore Timestamp
  if (x.seconds) return new Date(x.seconds * 1000); // serialized Timestamp
  if (typeof x === "string" || typeof x === "number") return new Date(x);
  return new Date(x);
};

const isSameMonth = (dateLike, monthIndex, year) => {
  const d = toDateSafe(dateLike);
  if (!d || isNaN(d.getTime())) return false;
  return d.getMonth() === monthIndex && d.getFullYear() === year;
};

const format1 = (n) => (Math.round(n * 10) / 10).toFixed(1);

export default function MonthlyBreakdownCard({
  title,
  monthIndex, // Dec=11, Jan=0, Feb=1
  year,
  users = [], // [{ uid, displayName }]
  activities = [],
  monthGoal, // { type: "Swim"|"Bike"|"Run", miles: number }
  allThreeGoal = { swim: 10, bike: 200, run: 75 },
}) {
  const rows = useMemo(() => {
    const byUid = {};

    // Ensure “lists everyone” even if they did nothing this month
    users.forEach((u) => {
      if (!u?.uid) return;
      byUid[u.uid] = {
        uid: u.uid,
        displayName: u.displayName || "(no name)",
        swim: 0,
        bike: 0,
        run: 0,
      };
    });

    // Sum this month’s totals per person
    activities.forEach((a) => {
      if (!a?.uid || !a.activityDateTime) return;
      if (!isSameMonth(a.activityDateTime, monthIndex, year)) return;

      if (!byUid[a.uid]) {
        byUid[a.uid] = {
          uid: a.uid,
          displayName: a.displayName || "(unknown)",
          swim: 0,
          bike: 0,
          run: 0,
        };
      }

      const miles = toMiles(a);
      const type = (a.activityType || "").trim();

      if (type === "Swim") byUid[a.uid].swim += miles;
      else if (type === "Bike") byUid[a.uid].bike += miles;
      else if (type === "Run") byUid[a.uid].run += miles;
      // ignore other activityType values
    });

    // Alphabetical list
    return Object.values(byUid).sort((a, b) =>
      (a.displayName || "").localeCompare(b.displayName || "")
    );
  }, [users, activities, monthIndex, year]);

  const getRowStyle = (r) => {
    // Yellow if they hit ALL THREE thresholds in the same month
    const hitAllThree =
      r.swim >= allThreeGoal.swim &&
      r.bike >= allThreeGoal.bike &&
      r.run >= allThreeGoal.run;

    if (hitAllThree) return { backgroundColor: "#fff59d" }; // yellow

    // Green if they hit that month’s specific goal
    const hitMonthGoal =
      (monthGoal?.type === "Swim" && r.swim >= monthGoal.miles) ||
      (monthGoal?.type === "Bike" && r.bike >= monthGoal.miles) ||
      (monthGoal?.type === "Run" && r.run >= monthGoal.miles);

    if (hitMonthGoal) return { backgroundColor: "#c8e6c9" }; // green

    return {};
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{title}</Typography>

        <Typography variant="body2" style={{ marginBottom: 12 }}>
          Green = {monthGoal?.type} ≥ {monthGoal?.miles} mi. Yellow = Swim ≥{" "}
          {allThreeGoal.swim}, Bike ≥ {allThreeGoal.bike}, Run ≥{" "}
          {allThreeGoal.run} (same month).
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Athlete</TableCell>
              <TableCell align="right">Swim (mi)</TableCell>
              <TableCell align="right">Bike (mi)</TableCell>
              <TableCell align="right">Run (mi)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.uid} style={getRowStyle(r)}>
                <TableCell>{r.displayName}</TableCell>
                <TableCell align="right">{format1(r.swim)}</TableCell>
                <TableCell align="right">{format1(r.bike)}</TableCell>
                <TableCell align="right">{format1(r.run)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
