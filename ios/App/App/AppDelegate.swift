//import UIKit
//import Capacitor
//
//@UIApplicationMain
//class AppDelegate: UIResponder, UIApplicationDelegate {
//
//    var window: UIWindow?
//
//    // MARK: - Кастомная схема и Capacitor
//    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
//
//        // 1️⃣ Ловим кастомные ссылки myapp://
//        if url.scheme == "myapp" {
//            switch url.host {
//            case "payment-success":
//                NotificationCenter.default.post(name: Notification.Name("payment-success"), object: nil)
//            case "payment-fail":
//                NotificationCenter.default.post(name: Notification.Name("payment-fail"), object: nil)
//            default:
//                break
//            }
//            return true
//        }
//
//        // 2️⃣ Передаем всё остальное Capacitor / другие SDK
//        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
//    }
//
//    // MARK: - Universal Links
//    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
//        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
//    }
//
//    // MARK: - Жизненный цикл приложения
//    func applicationWillResignActive(_ application: UIApplication) {
//        // Пауза задач, если нужно
//    }
//
//    func applicationDidEnterBackground(_ application: UIApplication) {
//        // Сохраняем состояние, если нужно
//    }
//
//    func applicationWillEnterForeground(_ application: UIApplication) {
//        // Подготовка перед возвращением в активное состояние
//    }
//
//    func applicationDidBecomeActive(_ application: UIApplication) {
//        // Перезапуск задач
//    }
//
//    func applicationWillTerminate(_ application: UIApplication) {
//        // Очистка перед завершением
//    }
//}
//



import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var webView: WKWebView?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {

        if let capVC = window?.rootViewController as? CAPBridgeViewController {
            self.webView = capVC.webView
        }

        return true
    }

    func application(_ app: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {

        if url.scheme == "myapp" {
            switch url.host {
            case "payment-success":
                NotificationCenter.default.post(name: Notification.Name("payment-success"), object: nil)
            case "payment-fail":
                NotificationCenter.default.post(name: Notification.Name("payment-fail"), object: nil)
            default:
                break
            }
            return true
        }

        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {

        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        webView?.evaluateJavaScript("""
            window.dispatchEvent(new Event('iosReturnFromBank'));
        """)
    }
}
