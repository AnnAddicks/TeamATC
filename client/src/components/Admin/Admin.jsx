import React from 'react';
import { Redirect } from 'react-router';
import { withRouter } from 'react-router-dom';

import Users from "../User/Users.jsx";
import { withContext } from "../Auth/Session/Context";
import { Container, Grid, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

import MonthlyBreakdownCard from "./MonthlyBreakdownCard";
import Util from "../Util/Util";

const styles = theme => ({
  root: {
    [theme.breakpoints.up('md')]: {
      marginLeft: "57px",
    },
    paddingTop: "10px"
  }
});

class Admin extends React.Component {

  state = {
    users: [],
    activities: [],
    loadingWinter: true,
    loadError: null,
  };

  async componentDidMount() {
    try {
      const firebase = Util.getFirebaseAuth();
      const db = firebase.firestore();

      // Dec 1, 2025 -> Mar 1, 2026 (exclusive)
      const start = new Date(2025, 11, 1);
      const end = new Date(2026, 2, 1);

      // USERS
      const usersSnap = await db.collection("users").get();
      const users = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
        displayName: d.data().displayName || d.data().name || d.data().fullName || "",
      }));

      // ACTIVITIES
      const actsQuery = db
        .collection("activities")
        .where("activityDateTime", ">=", start)
        .where("activityDateTime", "<", end);

      const actsSnap = await actsQuery.get();
      const activities = actsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      this.setState({ users, activities, loadingWinter: false, loadError: null });
    } catch (e) {
      this.setState({
        loadingWinter: false,
        loadError: e?.message || String(e),
      });
    }
  }

  // route to new user ( create )
  createUser = () => {
    this.props.history.push({
      pathname: '/userform'
    });
  }

  // go back to where you came from
  goBack = () => {
    this.props.history.goBack();
  }

  render() {
    const { classes } = this.props;
    const message = this.props && this.props.location && this.props.location.state ? this.props.location.state.message : "";

    if (this.props.context.authUser && this.props.context.isAdmin) {
      return (
        <div className={classes.root}>
          <Container>
            {/* Winter monthly cards */}
            {this.state.loadingWinter ? (
              <div>Loading winter monthly breakdowns…</div>
            ) : this.state.loadError ? (
              <div style={{ color: "red" }}>{this.state.loadError}</div>
            ) : (
              <Grid container spacing={2} style={{ marginTop: 12, marginBottom: 12 }}>
                <Grid item xs={12} md={6} lg={4}>
                  <MonthlyBreakdownCard
                    title="December 2025"
                    monthIndex={11}
                    year={2025}
                    users={this.state.users}
                    activities={this.state.activities}
                    monthGoal={{ type: "Swim", miles: 10 }}
                  />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                  <MonthlyBreakdownCard
                    title="January 2026"
                    monthIndex={0}
                    year={2026}
                    users={this.state.users}
                    activities={this.state.activities}
                    monthGoal={{ type: "Bike", miles: 200 }}
                  />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                  <MonthlyBreakdownCard
                    title="February 2026"
                    monthIndex={1}
                    year={2026}
                    users={this.state.users}
                    activities={this.state.activities}
                    monthGoal={{ type: "Run", miles: 75 }}
                  />
                </Grid>
              </Grid>
            )}

            {/* Existing Admin UI */}
            <Grid container>
              <Button variant="contained" color="primary" onClick={this.createUser}>
                Create User
              </Button>
            </Grid>

            <Users />
            <div>{message}</div>
          </Container>
        </div>
      );
    } else if (this.props.context.authUser) {
      return (
        <Redirect to="/actitivies" />
      );
    } else {
      return (
        <Redirect to="/signin" />
      );
    }
  }
}

export default withRouter(withContext(withStyles(styles)(Admin)));
