import UIKit
import WebKit

/// 全屏 WebView 容器。
/// 页面与资源通过 appassets://localhost/www/... 提供，由 AssetSchemeHandler 从 App 包里读取，
/// 这样 localStorage / fetch / 音频都有正常的 origin（file:// 会被当成不透明源，存档会丢）。
final class GameWebViewController: UIViewController {

    private enum Shell {
        static let scheme = "appassets"
        static let startURL = URL(string: "appassets://localhost/www/index.html")!
        /// 与网页端 topbar 底色一致，避免启动瞬间白屏闪一下
        static let background = UIColor(red: 0.910, green: 0.961, blue: 0.863, alpha: 1)
    }

    private var webView: WKWebView!

    override var preferredStatusBarStyle: UIStatusBarStyle {
        traitCollection.userInterfaceStyle == .dark ? .lightContent : .darkContent
    }

    /// 手机端只做竖屏（布局按竖屏设计，横屏会掉进桌面断点）；iPad 允许四向旋转
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        UIDevice.current.userInterfaceIdiom == .pad ? .all : .portrait
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = Shell.background

        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(AssetSchemeHandler(), forURLScheme: Shell.scheme)
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserGestureForMediaPlayback = []
        configuration.defaultWebpagePreferences.preferredContentMode = .mobile

        // 长按不弹选择 / 保存菜单，避免孩子误触；输入框不受影响
        let suppressCallout = """
        var style = document.createElement('style');
        style.textContent = 'html, body { -webkit-touch-callout: none; }';
        document.documentElement.appendChild(style);
        """
        configuration.userContentController.addUserScript(
            WKUserScript(source: suppressCallout, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        )

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.allowsBackForwardNavigationGestures = false
        // 底部 Tab 用 env(safe-area-inset-bottom) 自己留白，所以 WebView 要一直铺到屏幕底边
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        view.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        webView.load(URLRequest(url: Shell.startURL))
    }
}

extension GameWebViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() else {
            decisionHandler(.allow)
            return
        }
        if scheme == Shell.scheme {
            decisionHandler(.allow)
            return
        }
        // 站外链接交给系统浏览器，别把 App 变成浏览器
        if scheme == "http" || scheme == "https" {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }
}
