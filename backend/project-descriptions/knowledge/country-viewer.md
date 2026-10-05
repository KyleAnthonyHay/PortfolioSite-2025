---
project: Country Viewer
slug: country-viewer
type: project
role: solo
status: archived (early learning project, last updated March 2024)
---

# Country Viewer

## Overview and Features
<!-- meta: {"type":"project","project":"Country Viewer","category":"overview","technologies":["Swift","UIKit","REST Countries API","iOS"]} -->
Country Viewer (the repository is named Countries-App) is a small native iOS app that Kyle-Anthony Hay built solo to learn UIKit fundamentals. It pulls live data from the public REST Countries API and lets a user scroll through every country in the world, then tap one to see its details. Because the data comes from the API at runtime, figures such as population reflect whatever the API currently reports rather than values hard-coded into the app.

The git history places the build between October 24 and November 13, 2023, with README updates in March 2024. It is one of Kyle's earliest iOS projects and is best read as a fundamentals exercise: it shows him learning how a UIKit app is put together, not a production product.

What the app does:
- A Countries tab lists all countries in a table, each row showing the flag thumbnail, the common name, and the official name. If a flag URL is invalid, a fallback "no flag" system icon is shown.
- Tapping a country pushes a details screen, grouped into sections: the country name in a large title, a full-width flag banner, and the official name; a "Country Info" section with capital, population, currency name, and currency symbol; and a "Languages" section listing the country's languages.
- A tab bar with a Countries tab (globe icon) and a placeholder Settings tab (gear icon).
- Flags load asynchronously so scrolling is not blocked while images download.

The README also lists search by country name, but search is not implemented in the current code, so it should not be described as a shipped feature. There are no tests, App Store release, or user metrics for this project.

## Architecture and Technical Approach
<!-- meta: {"type":"project","project":"Country Viewer","category":"architecture","technologies":["Swift","UIKit","URLSession","Swift Concurrency","async/await","Codable","JSONDecoder","Auto Layout","UITableView","Grand Central Dispatch","REST Countries API"]} -->
Country Viewer follows a simple MVC (Model-View-Controller) structure built mostly in code with UIKit, with a storyboard providing the tab bar and navigation controllers.

Networking lives in a small API client, a struct with a shared instance and an injectable URLSession, which keeps it testable in principle. It has two async functions written with Swift Concurrency (async/await). The list call requests only the name and flag fields from the REST Countries API, which keeps the payload for the full country list small. The details call fetches a single country by name and picks the exact match on the common name, since that endpoint can return more than one result. Both calls check that the response is an HTTP response with a 2xx status code and throw a custom error otherwise. Responses are decoded with Codable models that use nested types for name, flag, and currency, and optional fields for population, capital, currencies, and languages, since not every country has every field.

The list and details screens are view controllers that each own a table view, pin it with Auto Layout anchors, kick off the fetch inside a Task in viewDidLoad, and reload the table when data arrives. The details screen is built with dependency injection through a custom initializer that takes the country name.

Images use a custom UIImageView extension that downloads with a URLSession download task, captures the view weakly to avoid retain cycles, and hops back to the main thread with Grand Central Dispatch before setting the image. The flag banner is a custom cell that resizes its constraints to the downloaded image's size and then tells the details screen, through a small delegate protocol, to call the table's begin and end updates so the row height animates to fit.

As an early learning project, Country Viewer focuses on UIKit fundamentals rather than production hardening; later projects such as SelahNote and SoundSnag show the fuller picture of cell reuse, error handling and user-facing error states. [NEEDS KYLE: hardest part in your words]

## Skills Demonstrated
<!-- meta: {"type":"project","project":"Country Viewer","category":"skills","technologies":["Swift","UIKit","URLSession","Swift Concurrency","async/await","Codable","Auto Layout","UITableView","REST API","Xcode"]} -->
Country Viewer demonstrates Kyle-Anthony Hay's early iOS development fundamentals, built solo in late 2023, before his later iOS, AI, and full-stack work.

iOS and Swift skills: native iOS development in Swift with UIKit, programmatic UI, UITableView data source and delegate patterns, custom table view cells, grouped table sections with headers, UINavigationController push navigation, UITabBarController tab navigation, SF Symbols, Auto Layout constraints written in code, dynamic cell sizing and animated row-height updates, and the delegate pattern with a custom protocol for child-to-parent communication. It also shows MVC architecture, custom view controller initializers for dependency injection, and working with Xcode and storyboards.

Networking and data skills: consuming a third-party REST API (REST Countries API), URLSession, Swift Concurrency with async/await and Task, HTTP status code validation, custom error types, JSON parsing with Codable and JSONDecoder, modeling nested and optional JSON fields, and requesting only needed fields to reduce payload size.

Concurrency and memory: asynchronous image loading and image downloading, weak self captures to avoid retain cycles, and dispatching UI updates to the main thread with Grand Central Dispatch.

Relevance: for iOS roles, this is evidence of solid UIKit groundwork (table views, navigation, layout, networking) that underpins Kyle's later iOS apps. For web, AI, or forward-deployed roles, it is mainly a signal of consistent hands-on practice with API integration and client-side data handling, rather than a flagship project.
