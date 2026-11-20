import UIKit
import Capacitor

/// Hosts the Capacitor web view inside the safe area, so nothing in the web page can
/// draw or scroll under the status bar / notch or the home indicator. The strips
/// above and below are plain native colour.
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
        // Full width, between the status bar / notch and the home indicator.
        bridgeViewController.view.frame = view.safeAreaLayoutGuide.layoutFrame
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
