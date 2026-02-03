# Contributing

Thanks for considering to contribute to React Canvas Draw!

Please use the `develop` branch when creating PRs. Below are the necessary steps to get going.

If you want to be added to the contributors list in the README,
please follow the [all-contributors bot instructions](https://allcontributors.org/docs/en/bot/usage).

## Prerequisites

- [Node.js](http://nodejs.org/) 설치가 필요합니다.
- 이 프로젝트는 `package.json`의 `volta` 설정을 통해 Node/NPM 버전을 고정합니다(권장).

## Installation

- Running `npm install` in the component's root directory will install everything you need for development.

## Demo Development Server

- `npm run dev` (또는 `npm start`)는 Vite 기반 데모 개발 서버를 실행합니다.
  - 기본 주소: [http://localhost:5173](http://localhost:5173)

## Running Tests

- `npm test` will run the tests once.

- `npm run test:coverage` will run the tests and produce a coverage report in `coverage/`.

- `npm run test:watch` will run the tests on every change.

## Formatting

- `npm run format`은 Prettier로 포맷을 자동 수정합니다.
- `npm run format:check`는 CI/훅에서 사용되는 포맷 체크입니다.

## Pre-commit Hook

이 프로젝트는 Husky를 사용해 pre-commit 훅을 실행합니다.

- 스테이징된 파일에 대해 `lint-staged`를 통해 Prettier가 적용됩니다.
- 이후 `npm test`가 실행됩니다.

## Building

- `npm run build`는 라이브러리 번들(`es/`, `lib/`, `umd/`)과 타입(`type/`)을 생성합니다.
- 데모 빌드는 `npm run build:demo`로 별도로 실행됩니다.

- `npm run clean` will delete built resources.

## Deploy (GitHub Pages)

- `npm run deploy`는 `demo/dist`를 생성한 뒤 `gh-pages`로 배포합니다.
