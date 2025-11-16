import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../../tests/utils/test-utils";
import { Button } from "./button";

/**
 * Example component test using React Testing Library
 * Following guidelines: accessibility-focused, user-centric testing
 */
describe("Button Component", () => {
  it("should render button with text", () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<Button disabled>Disabled Button</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it("should apply variant classes correctly", () => {
    // Arrange & Act
    render(<Button variant="destructive">Delete</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("bg-destructive");
  });

  it("should apply size classes correctly", () => {
    // Arrange & Act
    render(<Button size="lg">Large Button</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /large button/i });
    expect(button).toHaveClass("h-10");
  });

  it("should render as child component when asChild is true", () => {
    // Arrange & Act
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    // Assert
    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });
});
