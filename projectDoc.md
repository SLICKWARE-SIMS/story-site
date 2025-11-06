# Slickware Sims

This project is a React/TS project. It presents an interactive story for the user to play through. Each user needs to input a unique code to access their story. The asthetic is gritty cassette punk, as if the user was accessing a terminal.

## UI

This project uses the `@jquesnelle/crt-terminal` package for the interface.

## Story Import

Stories will be provided in markdown format in `stories`. There's a script in that directory to convert the raw markdown into JSON. The JSON should be baked into the build.

## Access code system

There will be a list of access codes. Each access code maps to a story. In the future, we may implement a backend to track access codes.
