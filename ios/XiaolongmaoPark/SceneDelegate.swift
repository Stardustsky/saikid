import UIKit

/// 场景化生命周期（iOS 26 起必需）：窗口在这里创建，界面内容是 GameWebViewController。
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = GameWebViewController()
        window.makeKeyAndVisible()
        self.window = window
    }
}
