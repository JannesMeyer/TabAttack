import AppKit

func printColorInfo(name: String, color: NSColor, appearance: NSAppearance) {
    appearance.performAsCurrentDrawingAppearance {
        if let srgb = color.usingColorSpace(.sRGB) {
            let r = Int(round(srgb.redComponent * 255.0))
            let g = Int(round(srgb.greenComponent * 255.0))
            let b = Int(round(srgb.blueComponent * 255.0))
            let a = String(format: "%.2f", srgb.alphaComponent)
            let hex = String(format: "#%02X%02X%02X", r, g, b)
            print("  \(name): rgba(\(r), \(g), \(b), \(a)) -> \(hex)")
        } else {
            print("  \(name): Unable to convert to sRGB")
        }
    }
}

let lightAppearance = NSAppearance(named: .aqua)!
let darkAppearance = NSAppearance(named: .darkAqua)!

print("=== Light Mode ===")
printColorInfo(name: "NSColor.controlTextColor", color: .controlTextColor, appearance: lightAppearance)
printColorInfo(name: "NSColor.labelColor", color: .labelColor, appearance: lightAppearance)
printColorInfo(name: "NSColor.windowBackgroundColor", color: .windowBackgroundColor, appearance: lightAppearance)

print("\n=== Dark Mode ===")
printColorInfo(name: "NSColor.controlTextColor", color: .controlTextColor, appearance: darkAppearance)
printColorInfo(name: "NSColor.labelColor", color: .labelColor, appearance: darkAppearance)
printColorInfo(name: "NSColor.windowBackgroundColor", color: .windowBackgroundColor, appearance: darkAppearance)
