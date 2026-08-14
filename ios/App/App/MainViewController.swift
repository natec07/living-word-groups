import UIKit
import WebKit
import Capacitor

// Capacitor's WKWebView content inset area (behind the status bar, above
// where the web page paints) is otherwise left at UIKit's default white,
// so dark mode showed a white bar across the top of the screen no matter
// what the web app's theme was.
//
// This used to derive the fill color from UITraitCollection.userInterfaceStyle
// (the device's OS-level light/dark setting), but this app lets a signed-in
// member pin the theme to Light or Dark independently of the system
// (Settings → Appearance) — when that pin disagrees with the OS setting,
// deriving from the OS trait paints the inset area the wrong color while
// the page content renders correctly, producing exactly the mismatch this
// fix was meant to prevent. Instead, src/components/native/native-theme-bridge.tsx
// posts the web app's actual resolved theme ("light"/"dark") through a
// WKScriptMessageHandler every time next-themes resolves or changes it, and
// this controller repaints to match.
class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private static let lightColor = UIColor(red: 0xFF / 255, green: 0xFF / 255, blue: 0xFF / 255, alpha: 1)
    private static let darkColor = UIColor(red: 0x14 / 255, green: 0x10 / 255, blue: 0x0D / 255, alpha: 1)

    override func viewDidLoad() {
        super.viewDidLoad()

        webView?.configuration.userContentController.add(self, name: "themeBridge")

        // Best-guess fill before the page's first themeBridge message
        // arrives, so there's no flash of the wrong color while the page
        // itself is still loading.
        applyTheme(isDark: traitCollection.userInterfaceStyle == .dark)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "themeBridge", let theme = message.body as? String else { return }
        applyTheme(isDark: theme == "dark")
    }

    private func applyTheme(isDark: Bool) {
        // isOpaque is deliberately left at its default (true): setting it to
        // false disables a WKWebView fast-scrolling compositing path, which
        // made `position: sticky`/`fixed` elements (the top app bar) drift
        // with the scroll instead of staying pinned. An opaque webview whose
        // backgroundColor already matches the app's theme looks identical —
        // we only need a solid color fill here, not real transparency.
        let color = isDark ? Self.darkColor : Self.lightColor
        view.backgroundColor = color
        webView?.backgroundColor = color
        webView?.scrollView.backgroundColor = color
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "themeBridge")
    }
}
