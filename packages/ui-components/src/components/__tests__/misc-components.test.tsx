import { test } from "node:test";
import assert from "node:assert/strict";
import { render, screen, cleanup } from "@testing-library/react";
import { Card } from "../Card.js";
import { Table } from "../Table.js";
import { Skeleton } from "../Skeleton.js";
import { Text } from "../Typography.js";

test.afterEach(() => {
  cleanup();
});

test("Card renders its children", () => {
  render(<Card>Hello</Card>);
  assert.ok(screen.getByText("Hello"));
});

test("Table renders real th[scope=col] headers and rows via accessible roles", () => {
  render(
    <Table
      caption="Test data"
      columns={[
        { key: "name", header: "Name", render: (r: { name: string }) => r.name },
        {
          key: "value",
          header: "Value",
          render: (r: { value: number }) => r.value,
          align: "right",
        },
      ]}
      rows={[
        { name: "Plot A", value: 12 },
        { name: "Plot B", value: 7 },
      ]}
      getRowKey={(r) => r.name}
    />,
  );
  const columnHeaders = screen.getAllByRole("columnheader");
  assert.equal(columnHeaders.length, 2);
  assert.equal(columnHeaders[0]!.textContent, "Name");
  assert.ok(screen.getByText("Plot A"));
  assert.ok(screen.getByText("12"));
});

test("Skeleton is hidden from assistive tech (presentation role)", () => {
  const { container } = render(<Skeleton />);
  const el = container.firstElementChild!;
  assert.equal(el.getAttribute("role"), "presentation");
  assert.equal(el.getAttribute("aria-hidden"), "true");
});

test("Text renders the correct default semantic tag per variant", () => {
  const { container: pageTitle } = render(<Text variant="pageTitle">Title</Text>);
  assert.equal(pageTitle.firstElementChild!.tagName, "H1");

  const { container: body } = render(<Text variant="body">Body copy</Text>);
  assert.equal(body.firstElementChild!.tagName, "P");
});

test("Text 'as' prop overrides the tag while keeping variant styling", () => {
  const { container } = render(
    <Text variant="sectionTitle" as="h3">
      Section
    </Text>,
  );
  assert.equal(container.firstElementChild!.tagName, "H3");
});
