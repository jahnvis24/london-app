import UIKit
import Capacitor

/// Hosts the Capacitor web view below the status bar / notch, so nothing in the web
/// page can draw or scroll under it. The strip above is plain native colour.
class ContainerViewController: UIViewController {
    let bridgeViewController = BridgeViewController()

    override func viewDidLoad() {
        super.viewDidLoad()
        // Curated cream (#FAF7F2), matching the app background.
        view.backgroundColor = UIColor(red: 250 / 255, green: 247 / 255, blue: 242 / 255, alpha: 1)

        addChild(bridgeViewController)
        view.addSubview(bridgeViewController.view)
        bridgeViewController.didMove(toParent: self)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Below the status bar / notch, down to the very bottom of the screen: the web
        // app's 88px tab bar is designed to run under the home indicator, like a native
        // tab bar. (Bounce is off, so page content can't scroll into that area either.)
        let top = view.safeAreaInsets.top
        bridgeViewController.view.frame = CGRect(x: 0, y: top, width: view.bounds.width, height: view.bounds.height - top)
    }

    override var childForStatusBarStyle: UIViewController? { bridgeViewController }
    override var childForStatusBarHidden: UIViewController? { bridgeViewController }
}

class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        // The web view already sits inside the safe area, so no extra insets, and no
        // rubber-band bounce (it stretched the page and tab bar at the end of a scroll).
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.scrollView.bounces = false
    }
}
