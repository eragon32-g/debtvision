import Card from './Card.jsx'

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/70 text-slate-500">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-base font-medium text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>
      )}
    </Card>
  )
}
