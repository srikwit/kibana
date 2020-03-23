/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import gql from 'graphql-tag';

export const monitorStatesSchema = gql`
  "Represents a monitor's statuses for a period of time."
  type SummaryHistogramPoint {
    "The time at which these data were collected."
    timestamp: UnsignedInteger!
    "The number of _up_ documents."
    up: Int!
    "The number of _down_ documents."
    down: Int!
  }

  "Monitor status data over time."
  type SummaryHistogram {
    "The number of documents used to assemble the histogram."
    count: Int!
    "The individual histogram data points."
    points: [SummaryHistogramPoint!]!
  }

  type Agent {
    id: String!
  }

  type Check {
    agent: Agent
    container: StateContainer
    kubernetes: StateKubernetes
    monitor: CheckMonitor!
    observer: CheckObserver
    timestamp: String!
  }

  type StateContainer {
    id: String
  }

  type StateKubernetes {
    pod: StatePod
  }

  type StatePod {
    uid: String
  }

  type CheckMonitor {
    ip: String
    name: String
    status: String!
  }

  type Location {
    lat: Float
    lon: Float
  }

  type CheckGeo {
    name: String
    location: Location
  }

  type CheckObserver {
    geo: CheckGeo
  }

  type StateGeo {
    name: [String]
    location: Location
  }

  type StateObserver {
    geo: StateGeo
  }

  type MonitorState {
    status: String
    name: String
    id: String
    type: String
  }

  type Summary {
    up: Int
    down: Int
    geo: CheckGeo
  }

  type MonitorSummaryUrl {
    domain: String
    fragment: String
    full: String
    original: String
    password: String
    path: String
    port: Int
    query: String
    scheme: String
    username: String
  }

  type StateUrl {
    domain: String
    full: String
    path: String
    port: Int
    scheme: String
  }

  "Contains monitor transmission encryption information."
  type StateTLS {
    "The date and time after which the certificate is invalid."
    certificate_not_valid_after: String
    certificate_not_valid_before: String
    certificates: String
    rtt: RTT
  }

  "Unifies the subsequent data for an uptime monitor."
  type State {
    "The agent processing the monitor."
    agent: Agent
    "There is a check object for each instance of the monitoring agent."
    checks: [Check!]
    geo: StateGeo
    observer: StateObserver
    monitor: MonitorState
    summary: Summary!
    timestamp: UnsignedInteger!
    "Transport encryption information."
    tls: [StateTLS]
    url: StateUrl
  }

  "Represents the current state and associated data for an Uptime monitor."
  type MonitorSummary {
    "The ID assigned by the config or generated by the user."
    monitor_id: String!
    "The state of the monitor and its associated details."
    state: State!
    histogram: SummaryHistogram
  }

  "The primary object returned for monitor states."
  type MonitorSummaryResult {
    "Used to go to the next page of results"
    prevPagePagination: String
    "Used to go to the previous page of results"
    nextPagePagination: String
    "The objects representing the state of a series of heartbeat monitors."
    summaries: [MonitorSummary!]
    "The number of summaries."
    totalSummaryCount: Int!
  }

  enum CursorDirection {
    AFTER
    BEFORE
  }

  enum SortOrder {
    ASC
    DESC
  }

  extend type Query {
    "Fetches the current state of Uptime monitors for the given parameters."
    getMonitorStates(
      dateRangeStart: String!
      dateRangeEnd: String!
      pagination: String
      filters: String
      statusFilter: String
      pageSize: Int
    ): MonitorSummaryResult
  }
`;
