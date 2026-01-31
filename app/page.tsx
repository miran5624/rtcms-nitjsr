'use client'

// landing page - redirects to login
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Clock, Shield, ChevronDown } from 'lucide-react'
import Link from 'next/link'

// faq data
const faqTopics = [
  { id: 'hostel', label: 'Hostel' },
  { id: 'mess', label: 'Mess' },
  { id: 'academic', label: 'Academic' },
  { id: 'internet', label: 'Internet / Network' },
  { id: 'infrastructure', label: 'Infrastructure' },
]

const faqData: Record<string, { question: string; answer: string }[]> = {
  hostel: [
    { question: 'How do I report a maintenance issue in my room?', answer: 'Submit a complaint under the Hostel category specifying your room number and the issue. An admin will claim and address it within 24-48 hours.' },
    { question: 'Can I request a room change through this system?', answer: 'Room change requests should be submitted to the hostel warden directly. This system handles maintenance and facility-related complaints only.' },
    { question: 'What if my hostel complaint is not resolved in time?', answer: 'Complaints unresolved within the specified timeframe are automatically escalated to the Super Admin for review and expedited action.' },
    { question: 'How do I report issues with common areas?', answer: 'Select Hostel category and specify the common area (bathroom, corridor, common room) in your complaint description.' },
  ],
  mess: [
    { question: 'How do I report food quality issues?', answer: 'Submit a complaint under the Mess category with details about the meal, date, and specific issue. Include photos if possible.' },
    { question: 'Can I suggest menu changes through complaints?', answer: 'Suggestions should be directed to the mess committee. This system is for reporting problems with existing services.' },
    { question: 'What if I found something unhygienic in my food?', answer: 'Report immediately under Mess category with High priority. Such complaints are treated with urgency and escalated if needed.' },
    { question: 'How do I report timing issues with mess services?', answer: 'Specify the date, expected time, and actual service time in your complaint under the Mess category.' },
  ],
  academic: [
    { question: 'Can I report issues with classroom facilities?', answer: 'Yes, submit under Academic category specifying the classroom number and the facility issue (projector, AC, seating, etc.).' },
    { question: 'How do I report problems with course registration?', answer: 'Course registration issues should be directed to the academic section. This system handles facility and infrastructure complaints.' },
    { question: 'What about library-related complaints?', answer: 'Library facility issues can be reported under Academic category. For book-related queries, contact the library directly.' },
    { question: 'Can I report issues with lab equipment?', answer: 'Yes, specify the lab name, equipment, and issue details under the Academic category.' },
  ],
  internet: [
    { question: 'How do I report WiFi connectivity issues?', answer: 'Submit under Internet/Network category with your hostel/building name, room number, and the nature of connectivity issues.' },
    { question: 'What if the LAN connection in my room is not working?', answer: 'Report the LAN port number and room details under Internet/Network category. IT staff will be assigned to resolve it.' },
    { question: 'Can I report slow internet speed?', answer: 'Yes, include details about the time of day, affected services, and your location in the complaint.' },
    { question: 'How long does it take to resolve network issues?', answer: 'Most network issues are resolved within 24 hours. Complex infrastructure issues may take longer.' },
  ],
  infrastructure: [
    { question: 'How do I report broken furniture or fixtures?', answer: 'Submit under Infrastructure category with location details and description of the damage.' },
    { question: 'Can I report water supply issues?', answer: 'Yes, report under Infrastructure with your block name and specific issue (no water, low pressure, leakage).' },
    { question: 'What about electrical issues?', answer: 'Report electrical problems immediately under Infrastructure with High priority. Include exact location and nature of issue.' },
    { question: 'How do I report issues with campus roads or pathways?', answer: 'Submit under Infrastructure specifying the location and hazard details. Include photos if possible.' },
  ],
}

export default function HomePage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  // check if user is already logged in
  useEffect(() => {
    const user = sessionStorage.getItem('user')
    if (user) {
      const parsed = JSON.parse(user)
      if (parsed.role === 'student') router.push('/student/dashboard')
      else if (parsed.role === 'admin') router.push('/admin/dashboard')
      else if (parsed.role === 'super_admin') router.push('/super-admin/dashboard')
    }
  }, [router])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* hero section with faq topic nav */}
        <section className="bg-secondary py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
              {/* hero content - left */}
              <div className="flex-1 lg:max-w-xl">
                <h2 className="mb-4 font-serif text-3xl font-bold text-primary md:text-4xl">
                  Smart Complaint Management System
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  A streamlined platform for students and staff to raise, track, and resolve
                  campus-related complaints efficiently.
                </p>
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      Login
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  {/* <Button variant="ghost">Learn More</Button> */}
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>

              {/* faq topic nav - right */}
              <div className="lg:w-64">
                <h3 className="mb-4 font-serif text-lg font-semibold text-primary">
                  Browse FAQs
                </h3>
                <nav className="flex flex-col gap-2">
                  {faqTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => scrollToSection(topic.id)}
                      className="text-left text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {topic.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </section>

        {/* detailed faq sections */}
        <section id="faqs" className="scroll-mt-24 py-16">
          <div className="container mx-auto max-w-3xl px-4">
            <h3 className="mb-12 text-center font-serif text-2xl font-bold text-primary">
              Frequently Asked Questions
            </h3>

            {faqTopics.map((topic) => (
              <div key={topic.id} id={topic.id} className="mb-12 scroll-mt-34">
                <h4 className="mb-6 border-b border-border pb-2 font-serif text-xl font-semibold text-primary">
                  {topic.label} FAQs
                </h4>
                <div className="flex flex-col">
                  {faqData[topic.id]?.map((faq, index) => {
                    const faqId = `${topic.id}-${index}`
                    const isOpen = openFaq === faqId
                    return (
                      <div key={faqId} className="border-b border-border/50">
                        <button
                          onClick={() => toggleFaq(faqId)}
                          className="flex w-full items-center justify-between py-4 text-left"
                        >
                          <span className="pr-4 font-medium text-foreground">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* features section */}
        <section className="bg-secondary py-16">
          <div className="container mx-auto px-4">
            <h3 className="mb-12 text-center font-serif text-2xl font-bold text-primary">
              Steps to Follow
            </h3>

            <div className="grid gap-8 md:grid-cols-3">
              {/* feature 1 */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 font-semibold text-foreground">Step 1</h4>
                <p className="text-sm text-muted-foreground">
                  Check if your complaint is already addressed in FAQs
                </p>
              </div>

              {/* feature 2 */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 font-semibold text-foreground">Step 2</h4>
                <p className="text-sm text-muted-foreground">
                  If not addressed, proceed to register a new complaint
                </p>
              </div>

              {/* feature 3 */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 font-semibold text-foreground">Step 3</h4>
                <p className="text-sm text-muted-foreground">
                  Track your complaint status in real-time with a complete activity
                  timeline showing all updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* important contacts section */}
        <section id="contacts" className="scroll-mt-24 py-16">
          <div className="container mx-auto px-4">
            <h3 className="mb-12 text-center font-serif text-2xl font-bold text-primary">
              Important Contacts
            </h3>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* hostel office */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-4 font-serif text-lg font-semibold text-primary">
                  Hostel Office
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Chief Warden:</span> Dr. Mukesh Tyagi
                  </p>
                  <p className="text-muted-foreground">
                    Phone: +91-6767223138
                  </p>
                  <p className="text-muted-foreground">
                    Email: chiefwarden@nitjsr.ac.in
                  </p>
                </div>
              </div>

              {/* mess committee */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-4 font-serif text-lg font-semibold text-primary">
                  Mess Committee
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Mess Coordinator:</span> Lovely Singh
                  </p>
                  <p className="text-muted-foreground">
                    Phone: +91-9472250190
                  </p>
                  <p className="text-muted-foreground">
                    Email: mess@nitjsr.ac.in
                  </p>
                </div>
              </div>

              {/* academic section */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-4 font-serif text-lg font-semibold text-primary">
                  Academic Section
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Dean Academics:</span> Prof. Jatil Yadav
                  </p>
                  <p className="text-muted-foreground">
                    Phone: +91-9472050190
                  </p>
                  <p className="text-muted-foreground">
                    Email: deanacad@nitjsr.ac.in
                  </p>
                </div>
              </div>

              {/* it services */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-4 font-serif text-lg font-semibold text-primary">
                  IT Services / Network
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">System Admin:</span> Koushlendra Kumar
                  </p>
                  <p className="text-muted-foreground">
                    Phone: +91-9472080190
                  </p>
                  <p className="text-muted-foreground">
                    Email: it@nitjsr.ac.in
                  </p>
                </div>
              </div>

              {/* estate / infrastructure */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-4 font-serif text-lg font-semibold text-primary">
                  Estate / Infrastructure
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Estate Officer:</span> Dr. Subrata Dutta
                  </p>
                  <p className="text-muted-foreground">
                    Phone: +91-9472280190
                  </p>
                  <p className="text-muted-foreground">
                    Email: estate@nitjsr.ac.in
                  </p>
                </div>
              </div>

              {/* general enquiry */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="mb-4 font-serif text-lg font-semibold text-primary">
                  General Enquiry
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Reception:</span> Main Office
                  </p>
                  <p className="text-muted-foreground">
                    Phone: +91-9472290560
                  </p>
                  <p className="text-muted-foreground">
                    Email: enquiry@nitjsr.ac.in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="border-t border-border bg-primary py-8">
          <div className="container mx-auto px-4 text-center text-sm text-primary-foreground">
            <p className="font-serif text-lg">National Institute of Technology Jamshedpur</p>
            <p className="mt-1 text-primary-foreground/80">Smart Complaint Management System</p>
            <p className="mt-4 text-xs text-primary-foreground/60">
              Adityapur, Jamshedpur - 831014, Jharkhand, India
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
