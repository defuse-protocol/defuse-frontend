import type { Page } from "@playwright/test"
import { BasePage } from "./base.page"

export class HomePage extends BasePage {
  page: Page

  constructor(page: Page) {
    super(page)
    this.page = page
  }
}
