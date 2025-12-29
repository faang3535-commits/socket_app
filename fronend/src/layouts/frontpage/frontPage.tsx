import Navbar from "@/components/navbar";
import { Link } from "react-router-dom";

const FrontPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white font-sans selection:bg-blue-500/30">
            <Navbar />

            <main className="pt-20 md:pt-19">
                <section className="min-h-[80vh] text-center bg-[radial-gradient(#ffffff33_1px,#181818_1px)] bg-size-[20px_20px]">
                    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_87%,rgba(24,24,24,1))]">
                        <div className="max-w-4xl mx-auto ">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-teal-400">
                                Connect Instantly, Chat Seamlessly
                            </h1>
                            <p className="mt-4 text-lg md:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
                                A powerful and intuitive chat application designed for modern teams and communities. Experience real-time messaging like never before.
                            </p>
                            <div className="mt-8 flex justify-center gap-4">
                                <Link to="/register" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors">
                                    Get Started for Free
                                </Link>
                                <Link to="#" className="px-8 py-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Our Chat?</h2>
                            <p className="mt-2 text-neutral-500 dark:text-neutral-400">Everything you need in a modern chat application.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-linear-to-br from-red-400 to-orange-500 w-12 h-12 rounded-lg mb-4"></div>
                                <h3 className="text-xl font-bold mb-2">Real-time</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">Instant message delivery for fluid conversations. No delays, no waiting.</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-linear-to-br from-blue-400 to-indigo-600 w-12 h-12 rounded-lg mb-4"></div>
                                <h3 className="text-xl font-bold mb-2">Scalable</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">Built to handle conversations of any size, from one-on-one chats to large groups.</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-linear-to-br from-emerald-400 to-teal-500 w-12 h-12 rounded-lg mb-4"></div>
                                <h3 className="text-xl font-bold mb-2">Secure</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">End-to-end encryption to ensure your conversations are private and secure.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="py-8">
                    <div className="container mx-auto px-4 text-center text-neutral-500 dark:text-neutral-400">
                        <p>&copy; 2025 ChatApp. All rights reserved.</p>
                    </div>
                </footer>
            </main>
        </div>
    )
}
export default FrontPage;